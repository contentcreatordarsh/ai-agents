import { Hono } from "hono";
import type { Env } from "../../env";
import { joinCode, newId, publicGameId } from "../../lib/ids";
import { requireUser } from "./auth";
import type { TeamId } from "../../types/game";

export const gameRoutes = new Hono<{ Bindings: Env }>();

gameRoutes.post("/demo/init", async (c) => {
  const demoId = "demo_city_battle";
  await gameStub(c.env, demoId).fetch(
    new Request("http://do/init", {
      method: "POST",
      body: JSON.stringify({
        gameId: demoId,
        centerLat: 1.3521,
        centerLng: 103.8198,
        radiusM: 5000,
        durationSec: 3600,
        demo: true,
      }),
    }),
  );
  return c.json({ gameId: demoId, demo: true });
});

function gameStub(env: Env, gameId: string) {
  return env.STRIKE_GAME.get(env.STRIKE_GAME.idFromName(gameId));
}

gameRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json<{
    locationName: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    durationMin: number;
    teamCount: number;
    maxPlayers: number;
    turnstileToken?: string;
  }>();
  const gameId = newId("game");
  const pubId = publicGameId();
  const code = joinCode();
  const now = Date.now();
  const radiusM = Math.min(20_000, Math.max(500, Math.round(body.radiusKm * 1000)));
  const durationSec = Math.min(24 * 3600, Math.max(600, body.durationMin * 60));
  await c.env.DB.prepare(
    `INSERT INTO games (id, public_id, join_code, host_user_id, center_lat, center_lng, radius_m, duration_sec, team_count, max_players, location_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      gameId,
      pubId,
      code,
      user.id,
      body.centerLat,
      body.centerLng,
      radiusM,
      durationSec,
      body.teamCount ?? 4,
      body.maxPlayers ?? 32,
      body.locationName ?? "Battle Zone",
      now,
    )
    .run();

  await gameStub(c.env, gameId).fetch(
    new Request("http://do/init", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        centerLat: body.centerLat,
        centerLng: body.centerLng,
        radiusM,
        durationSec,
        demo: false,
      }),
    }),
  );

  return c.json({
    id: gameId,
    publicId: pubId,
    joinCode: code,
    joinUrl: `${c.env.PUBLIC_APP_URL}/join/${code}`,
  });
});

gameRoutes.get("/join/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const row = await c.env.DB.prepare("SELECT * FROM games WHERE join_code = ?")
    .bind(code)
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({
    game: {
      id: row.id,
      publicId: row.public_id,
      status: row.status,
      locationName: row.location_name,
      centerLat: row.center_lat,
      centerLng: row.center_lng,
      radiusM: row.radius_m,
      durationSec: row.duration_sec,
      joinCode: row.join_code,
    },
  });
});

gameRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM games WHERE id = ? OR public_id = ?")
    .bind(id, id)
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  const players = await c.env.DB.prepare(
    `SELECT gp.team, gp.user_id, u.username FROM game_players gp JOIN users u ON u.id = gp.user_id WHERE gp.game_id = ?`,
  )
    .bind(row.id)
    .all();
  return c.json({ game: row, players: players.results });
});

gameRoutes.post("/:id/join", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const gameId = c.req.param("id");
  const body = await c.req.json<{ team: TeamId; joinCode?: string }>();
  const game = await c.env.DB.prepare("SELECT * FROM games WHERE id = ? OR public_id = ?")
    .bind(gameId, gameId)
    .first<{ id: string; join_code: string; status: string; max_players: number }>();
  if (!game) return c.json({ error: "not_found" }, 404);
  if (game.status !== "lobby") return c.json({ error: "game_not_joinable" }, 400);
  if (body.joinCode && body.joinCode.toUpperCase() !== game.join_code) {
    return c.json({ error: "invalid_code" }, 403);
  }
  const count = await c.env.DB.prepare("SELECT COUNT(*) as c FROM game_players WHERE game_id = ?")
    .bind(game.id)
    .first<{ c: number }>();
  if ((count?.c ?? 0) >= game.max_players) return c.json({ error: "full" }, 409);
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO game_players (game_id, user_id, team, joined_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(game_id, user_id) DO UPDATE SET team = excluded.team`,
  )
    .bind(game.id, user.id, body.team, now)
    .run();
  return c.json({ ok: true, gameId: game.id });
});

gameRoutes.post("/:id/start", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const gameId = c.req.param("id");
  const game = await c.env.DB.prepare("SELECT * FROM games WHERE id = ? AND host_user_id = ?")
    .bind(gameId, user.id)
    .first();
  if (!game) return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("UPDATE games SET status = 'active', started_at = ? WHERE id = ?")
    .bind(Date.now(), gameId)
    .run();
  await gameStub(c.env, gameId).fetch(new Request("http://do/start", { method: "POST" }));
  return c.json({ ok: true });
});

gameRoutes.post("/:id/end", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const gameId = c.req.param("id");
  const game = await c.env.DB.prepare("SELECT * FROM games WHERE id = ? AND host_user_id = ?")
    .bind(gameId, user.id)
    .first();
  if (!game) return c.json({ error: "forbidden" }, 403);
  await gameStub(c.env, gameId).fetch(new Request("http://do/end", { method: "POST" }));
  return c.json({ ok: true });
});
