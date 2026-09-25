import { Hono } from "hono";
import type { Env } from "../../../env";
import { apiErr, apiOk } from "../../lib/api-response";
import { joinCode, newId } from "../../../lib/ids";
import { requireUserV1 } from "./auth";
import type { CreateGameRequest, JoinGameRequest } from "../../../shared/contracts/api";
import {
  ALL_TEAM_COLORS,
  gameStatusFromDb,
  gameStatusToDb,
  teamColorFromDb,
  teamColorToDb,
  type TeamColor,
} from "../../../shared/contracts/game";
import { issueRealtimeToken } from "../../../lib/realtime-token";
import { buildTeamsFromScores, emptyScores, mapDbGame } from "../../lib/game-mapper";

export const v1GameRoutes = new Hono<{ Bindings: Env; Variables: { requestId: string } }>();

function gameStub(env: Env, gameId: string) {
  return env.STRIKE_GAME.get(env.STRIKE_GAME.idFromName(gameId));
}

async function loadGame(env: Env, gameId: string) {
  return env.DB.prepare("SELECT * FROM games WHERE id = ? OR join_code = ? OR public_id = ?")
    .bind(gameId, gameId.toUpperCase(), gameId)
    .first();
}

v1GameRoutes.post("/demo/init", async (c) => {
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
  return apiOk(c, { gameId: demoId, demo: true });
});

v1GameRoutes.post("/", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const body = await c.req.json<CreateGameRequest>();
  if (body.radiusM < 100 || body.radiusM > 50_000) {
    return apiErr(c, "VALIDATION_ERROR", "radiusM must be 100–50000", 400);
  }
  if (body.durationSeconds < 900 || body.durationSeconds > 86_400) {
    return apiErr(c, "VALIDATION_ERROR", "durationSeconds must be 900–86400", 400);
  }
  if (body.teamCount < 2 || body.teamCount > 4) {
    return apiErr(c, "VALIDATION_ERROR", "teamCount must be 2–4", 400);
  }
  if (body.maxPlayers < 2 || body.maxPlayers > 200) {
    return apiErr(c, "VALIDATION_ERROR", "maxPlayers must be 2–200", 400);
  }
  const gameId = newId("game");
  const code = joinCode();
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO games (id, public_id, join_code, host_user_id, center_lat, center_lng, radius_m, duration_sec, team_count, max_players, location_name, created_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lobby')`,
  )
    .bind(
      gameId,
      gameId,
      code,
      user.id,
      body.center.lat,
      body.center.lng,
      body.radiusM,
      body.durationSeconds,
      body.teamCount,
      body.maxPlayers,
      body.name,
      now,
    )
    .run();

  await gameStub(c.env, gameId).fetch(
    new Request("http://do/init", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        centerLat: body.center.lat,
        centerLng: body.center.lng,
        radiusM: body.radiusM,
        durationSec: body.durationSeconds,
        demo: false,
      }),
    }),
  );

  const joinUrl = `https://strikemap.space/join/${code}`;
  return apiOk(c, {
    game: { id: gameId, code, status: "LOBBY" as const, name: body.name, joinUrl },
  });
});

v1GameRoutes.get("/:gameId", async (c) => {
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  const counts = await c.env.DB.prepare(
    `SELECT team, COUNT(*) as c FROM game_players WHERE game_id = ? GROUP BY team`,
  )
    .bind(row.id)
    .all<{ team: string; c: number }>();
  const playerCounts = emptyScores();
  for (const r of counts.results ?? []) {
    playerCounts[teamColorFromDb(r.team)] = r.c;
  }
  const teams = buildTeamsFromScores(emptyScores(), playerCounts, emptyScores());
  const game = mapDbGame(row as never, teams);
  const total = await c.env.DB.prepare("SELECT COUNT(*) as c FROM game_players WHERE game_id = ?")
    .bind(row.id)
    .first<{ c: number }>();
  return apiOk(c, { game, teams, playerCount: total?.c ?? 0 });
});

v1GameRoutes.post("/:gameId/join", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const body = await c.req.json<JoinGameRequest>().catch(() => ({} as JoinGameRequest));
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  if (gameStatusFromDb(row.status as string) !== "LOBBY") {
    return apiErr(c, "GAME_NOT_ACTIVE", "Game is not joinable", 400);
  }
  const existing = await c.env.DB.prepare(
    "SELECT team FROM game_players WHERE game_id = ? AND user_id = ?",
  )
    .bind(row.id, user.id)
    .first<{ team: string }>();
  if (existing) {
    return apiOk(c, {
      player: { id: user.id, team: teamColorFromDb(existing.team) },
      game: { id: row.id, status: gameStatusFromDb(row.status as string) },
    });
  }
  const count = await c.env.DB.prepare("SELECT COUNT(*) as c FROM game_players WHERE game_id = ?")
    .bind(row.id)
    .first<{ c: number }>();
  if ((count?.c ?? 0) >= (row.max_players as number)) {
    return apiErr(c, "GAME_FULL", "Game is full", 409);
  }
  let team: TeamColor = body.team ?? "BLUE";
  if (!body.team) {
    const teams = await c.env.DB.prepare(
      `SELECT team, COUNT(*) as c FROM game_players WHERE game_id = ? GROUP BY team`,
    )
      .bind(row.id)
      .all<{ team: string; c: number }>();
    const tally = new Map<TeamColor, number>();
    for (const t of ALL_TEAM_COLORS) tally.set(t, 0);
    for (const t of teams.results ?? []) tally.set(teamColorFromDb(t.team), t.c);
    team = ALL_TEAM_COLORS.reduce((a, b) => ((tally.get(a) ?? 0) <= (tally.get(b) ?? 0) ? a : b));
  }
  const now = Date.now();
  await c.env.DB.prepare(
    "INSERT INTO game_players (game_id, user_id, team, joined_at) VALUES (?, ?, ?, ?)",
  )
    .bind(row.id, user.id, teamColorToDb(team), now)
    .run();
  await gameStub(c.env, row.id as string).fetch(
    new Request("http://do/player-join", {
      method: "POST",
      body: JSON.stringify({ playerId: user.id, username: user.username, team }),
    }),
  );
  return apiOk(c, {
    player: { id: user.id, team },
    game: { id: row.id, status: gameStatusFromDb(row.status as string) },
  });
});

v1GameRoutes.post("/:gameId/leave", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  await c.env.DB.prepare("DELETE FROM game_players WHERE game_id = ? AND user_id = ?")
    .bind(row.id, user.id)
    .run();
  await gameStub(c.env, row.id as string).fetch(
    new Request("http://do/player-leave", {
      method: "POST",
      body: JSON.stringify({ playerId: user.id, reason: "LEFT_GAME" }),
    }),
  );
  return apiOk(c, { left: true });
});

v1GameRoutes.post("/:gameId/start", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  if (row.host_user_id !== user.id) return apiErr(c, "FORBIDDEN", "Only creator can start", 403);
  await c.env.DB.prepare("UPDATE games SET status = ? WHERE id = ?")
    .bind(gameStatusToDb("COUNTDOWN"), row.id)
    .run();
  await gameStub(c.env, row.id as string).fetch(new Request("http://do/start", { method: "POST" }));
  return apiOk(c, { status: "COUNTDOWN" as const, countdownSeconds: 10 });
});

v1GameRoutes.post("/:gameId/end", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  if (row.host_user_id !== user.id) return apiErr(c, "FORBIDDEN", "Only creator can end", 403);
  const body = await c.req.json<{ reason?: string }>().catch(() => ({}));
  await gameStub(c.env, row.id as string).fetch(
    new Request("http://do/end", {
      method: "POST",
      body: JSON.stringify({ reason: body.reason ?? "MANUAL" }),
    }),
  );
  return apiOk(c, { status: "FINISHED" as const });
});

v1GameRoutes.get("/:gameId/state", async (c) => {
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  const snapRes = await gameStub(c.env, row.id as string).fetch(new Request("http://do/snapshot-contract"));
  const data = await snapRes.json();
  return apiOk(c, data);
});

v1GameRoutes.post("/:gameId/location", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const body = await c.req.json<{ lat: number; lng: number; accuracyM?: number; timestamp: string }>();
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  const member = await c.env.DB.prepare(
    "SELECT 1 FROM game_players WHERE game_id = ? AND user_id = ?",
  )
    .bind(row.id, user.id)
    .first();
  if (!member) return apiErr(c, "NOT_A_PLAYER", "Not a member of this game", 403);
  const res = await gameStub(c.env, row.id as string).fetch(
    new Request("http://do/location", {
      method: "POST",
      body: JSON.stringify({ playerId: user.id, ...body }),
    }),
  );
  if (!res.ok) {
    const err = (await res.json()) as { code?: string; message?: string };
    return apiErr(c, (err.code as never) ?? "INVALID_LOCATION", err.message ?? "Rejected", 400);
  }
  return apiOk(c, { accepted: true });
});

v1GameRoutes.get("/:gameId/leaderboard", async (c) => {
  const scope = c.req.query("scope") ?? "GAME";
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row && scope === "GAME") return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  if (scope === "GAME") {
    const snapRes = await gameStub(c.env, row!.id as string).fetch(new Request("http://do/leaderboard"));
    const data = await snapRes.json();
    return apiOk(c, data);
  }
  const since =
    scope === "WEEKLY"
      ? Date.now() - 7 * 86400_000
      : scope === "MONTHLY"
        ? Date.now() - 30 * 86400_000
        : 0;
  const rows =
    scope === "GLOBAL"
      ? await c.env.DB.prepare(
          `SELECT u.username, p.total_xp as xp, p.level FROM profiles p JOIN users u ON u.id = p.user_id ORDER BY p.total_xp DESC LIMIT 50`,
        ).all()
      : await c.env.DB.prepare(
          `SELECT u.username, SUM(x.amount) as xp FROM xp_events x JOIN users u ON u.id = x.user_id WHERE x.created_at > ? GROUP BY x.user_id ORDER BY xp DESC LIMIT 50`,
        )
          .bind(since)
          .all();
  const entries = (rows.results ?? []).map((r, i) => ({
    rank: i + 1,
    playerId: `global_${i}`,
    username: (r as { username: string }).username,
    team: "BLUE" as TeamColor,
    score: 0,
    xp: Number((r as { xp: number }).xp ?? 0),
  }));
  return apiOk(c, { entries });
});

v1GameRoutes.post("/:gameId/realtime/connect", async (c) => {
  const user = await requireUserV1(c);
  if (!user) return apiErr(c, "UNAUTHORIZED", "Authentication required", 401);
  const row = await loadGame(c.env, c.req.param("gameId"));
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  const gp = await c.env.DB.prepare("SELECT team FROM game_players WHERE game_id = ? AND user_id = ?")
    .bind(row.id, user.id)
    .first<{ team: string }>();
  const team = gp?.team ?? "blue";
  const token = await issueRealtimeToken(c.env.KV, {
    gameId: row.id as string,
    userId: user.id,
    username: user.username,
    team,
    demo: false,
  });
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  return apiOk(c, { token, expiresAt, protocol: "STRIKEMAP_GAME_V1" });
});

v1GameRoutes.get("/join/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const row = await loadGame(c.env, code);
  if (!row) return apiErr(c, "GAME_NOT_FOUND", "Game does not exist", 404);
  const teams = buildTeamsFromScores(emptyScores(), emptyScores(), emptyScores());
  return apiOk(c, { game: mapDbGame(row as never, teams) });
});
