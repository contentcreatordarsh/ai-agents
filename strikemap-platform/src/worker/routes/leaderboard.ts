import { Hono } from "hono";
import type { Env } from "../../env";

export const leaderboardRoutes = new Hono<{ Bindings: Env }>();

leaderboardRoutes.get("/global", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT u.username, p.total_xp, p.level, p.wins, ps.games_played
     FROM profiles p JOIN users u ON u.id = p.user_id
     JOIN player_stats ps ON ps.user_id = p.user_id
     ORDER BY p.total_xp DESC LIMIT 50`,
  ).all();
  return c.json({ scope: "global", entries: rows.results });
});

leaderboardRoutes.get("/weekly", async (c) => {
  const since = Date.now() - 7 * 86400_000;
  const rows = await c.env.DB.prepare(
    `SELECT u.username, SUM(x.amount) as xp
     FROM xp_events x JOIN users u ON u.id = x.user_id
     WHERE x.created_at > ?
     GROUP BY x.user_id ORDER BY xp DESC LIMIT 50`,
  )
    .bind(since)
    .all();
  return c.json({ scope: "weekly", entries: rows.results });
});
