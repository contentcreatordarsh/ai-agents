import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../env";
import { requestIdMiddleware } from "./middleware/request-id";
import { apiOk } from "./lib/api-response";
import { v1GameRoutes } from "./routes/v1/games";
import { v1AuthRoutes, requireUserV1 } from "./routes/v1/auth";
import { consumeRealtimeToken } from "../lib/realtime-token";
import { WS_PROTOCOL_VERSION } from "../shared/contracts/events";
import { authRoutes } from "./routes/auth";
import { gameRoutes } from "./routes/games";
import { leaderboardRoutes } from "./routes/leaderboard";

type Variables = { requestId: string };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
    exposeHeaders: ["X-Request-ID"],
  }),
);

app.use("*", requestIdMiddleware);

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

app.get("/api/health", (c) =>
  apiOk(c, { service: "strikemap-gateway", edge: true }),
);

app.get("/api/v1/health", (c) => apiOk(c, { service: "strikemap-gateway", version: "v1" }));

app.route("/api/v1/auth", v1AuthRoutes);
app.route("/api/v1/games", v1GameRoutes);
app.get("/api/v1/profile/me", async (c) => {
  const user = await requireUserV1(c);
  if (!user) {
    return c.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required", requestId: c.get("requestId") },
      },
      401,
    );
  }
  const stats = await c.env.DB.prepare("SELECT * FROM player_stats WHERE user_id = ?")
    .bind(user.id)
    .first<{ games_played: number; games_won: number; captures: number }>();
  return apiOk(c, {
    profile: {
      id: user.id,
      username: user.username,
      level: user.level,
      xp: user.totalXp,
      wins: stats?.games_won ?? 0,
      gamesPlayed: stats?.games_played ?? 0,
      territoriesCaptured: stats?.captures ?? 0,
      currentStreak: 0,
      avatarUrl: null,
    },
  });
});

/** Legacy routes (deprecated — use /api/v1) */
app.route("/api/auth", authRoutes);
app.route("/api/games", gameRoutes);
app.route("/api/leaderboard", leaderboardRoutes);

async function upgradeToGame(
  c: { env: Env; req: { header: (n: string) => string | undefined; raw: Request }; param: (n: string) => string },
  ticket: { gameId: string; userId: string; username: string; team: string; demo: boolean },
) {
  const gameId = c.param("gameId");
  if (ticket.gameId !== gameId && gameId !== "demo_city_battle") {
    return new Response("forbidden", { status: 403 });
  }
  const stub = c.env.STRIKE_GAME.get(c.env.STRIKE_GAME.idFromName(gameId));
  const headers = new Headers(c.req.raw.headers);
  headers.set("X-StrikeMap-Player-Id", ticket.userId);
  headers.set("X-StrikeMap-Username", ticket.username);
  headers.set("X-StrikeMap-Team", ticket.team);
  headers.set("X-StrikeMap-Demo", ticket.demo ? "1" : "0");
  return stub.fetch(new Request(c.req.raw.url, { headers, method: c.req.raw.method }));
}

async function wsGameHandler(c: {
  req: { header: (n: string) => string | undefined; raw: Request };
  param: (n: string) => string;
  env: Env;
  json: (body: unknown, status?: number) => Response;
}) {
  if (c.req.header("Upgrade") !== "websocket") {
    return c.json({ ok: false, error: { code: "INVALID_EVENT", message: "Expected websocket" } }, 426);
  }
  const gameId = c.param("gameId");
  const protocols = (c.req.header("Sec-WebSocket-Protocol") ?? "").split(",").map((s) => s.trim());
  if (!protocols.includes(WS_PROTOCOL_VERSION)) {
    return new Response("protocol required", { status: 426 });
  }
  const token = protocols.find((p) => p.startsWith("rt_"));
  if (gameId === "demo_city_battle") {
    return upgradeToGame(c, {
      gameId,
      userId: `guest_${crypto.randomUUID().slice(0, 8)}`,
      username: "DEMO_Guest",
      team: "GREEN",
      demo: true,
    });
  }
  if (!token) return new Response("missing token", { status: 401 });
  const ticket = await consumeRealtimeToken(c.env.KV, token);
  if (!ticket) return new Response("invalid token", { status: 401 });
  return upgradeToGame(c, ticket);
}

/** Canonical: wss://strikemap.space/ws/v1/games/{gameId} */
app.get("/ws/v1/games/:gameId", (c) => wsGameHandler(c));

/** Legacy alias */
app.get("/ws/games/:gameId", (c) => wsGameHandler(c));

/** Legacy WS paths */
app.get("/game/demo/ws", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") return c.json({ error: "expected_websocket" }, 426);
  return upgradeToGame(c, {
    gameId: "demo_city_battle",
    userId: `guest_${crypto.randomUUID().slice(0, 8)}`,
    username: "DEMO_Guest",
    team: "green",
    demo: true,
  });
});

app.all("*", async (c) => {
  if (
    c.req.path.startsWith("/api/") ||
    c.req.path.startsWith("/game/") ||
    c.req.path.startsWith("/ws/")
  ) {
    return c.notFound();
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
