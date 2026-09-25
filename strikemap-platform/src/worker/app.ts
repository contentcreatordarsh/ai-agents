import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../env";
import { authRoutes } from "./routes/auth";
import { gameRoutes } from "./routes/games";
import { leaderboardRoutes } from "./routes/leaderboard";
import { requireUser } from "./routes/auth";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "strikemap-platform", edge: true }),
);

app.route("/api/auth", authRoutes);
app.route("/api/games", gameRoutes);
app.route("/api/leaderboard", leaderboardRoutes);

app.get("/api/profile/:userId", async (c) => {
  const userId = c.req.param("userId");
  const profile = await c.env.DB.prepare(
    `SELECT p.*, u.username, ps.games_played, ps.games_won, ps.captures
     FROM profiles p JOIN users u ON u.id = p.user_id
     LEFT JOIN player_stats ps ON ps.user_id = p.user_id
     WHERE p.user_id = ? OR u.username = ?`,
  )
    .bind(userId, userId)
    .first();
  if (!profile) return c.json({ error: "not_found" }, 404);
  return c.json({ profile });
});

/** Demo WebSocket without auth (must be before :gameId route) */
app.get("/game/demo/ws", async (c) => {
  const upgrade = c.req.header("Upgrade");
  if (upgrade !== "websocket") return c.json({ error: "expected_websocket" }, 426);
  const stub = c.env.STRIKE_GAME.get(c.env.STRIKE_GAME.idFromName("demo_city_battle"));
  const url = new URL(c.req.url);
  url.pathname = "/";
  url.searchParams.set("playerId", `guest_${crypto.randomUUID().slice(0, 8)}`);
  url.searchParams.set("username", "DEMO_Guest");
  url.searchParams.set("team", "green");
  url.searchParams.set("demo", "1");
  url.searchParams.set("lat", "1.3521");
  url.searchParams.set("lng", "103.8198");
  return stub.fetch(new Request(url.toString(), { headers: c.req.raw.headers }));
});

/** WebSocket upgrade → game Durable Object */
app.get("/game/:gameId/ws", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const gameId = c.req.param("gameId");
  const team = (c.req.query("team") ?? "blue") as string;
  const lat = c.req.query("lat") ?? "0";
  const lng = c.req.query("lng") ?? "0";
  const demo = c.req.query("demo") === "1" ? "1" : "0";
  const upgrade = c.req.header("Upgrade");
  if (upgrade !== "websocket") {
    return c.json({ error: "expected_websocket" }, 426);
  }
  const stub = c.env.STRIKE_GAME.get(c.env.STRIKE_GAME.idFromName(gameId));
  const url = new URL(c.req.url);
  url.searchParams.set("playerId", user.id);
  url.searchParams.set("username", user.username);
  url.searchParams.set("team", team);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  url.searchParams.set("demo", demo);
  return stub.fetch(
    new Request(url.toString(), { headers: c.req.raw.headers }),
  );
});

app.all("*", async (c) => {
  if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/game/")) {
    return c.notFound();
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
