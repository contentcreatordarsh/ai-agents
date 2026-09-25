import type { Env, GameQueueMessage } from "../env";
import { newId } from "../lib/ids";

export async function handleGameEventBatch(batch: MessageBatch<GameQueueMessage>, env: Env) {
  for (const msg of batch.messages) {
    try {
      await processGameEvent(msg.body, env);
      msg.ack();
    } catch (e) {
      console.error("queue process error", e);
      msg.retry();
    }
  }
}

async function processGameEvent(body: GameQueueMessage, env: Env) {
  const now = Date.now();
  if (body.type === "territory_captured") {
    await env.DB.prepare(
      `INSERT INTO territory_events (id, game_id, territory_id, event_type, team, payload_json, created_at)
       VALUES (?, ?, ?, 'captured', ?, ?, ?)`,
    )
      .bind(newId("tev"), body.gameId, body.territoryId, body.team, JSON.stringify({}), now)
      .run();
  }
  if (body.type === "xp_award") {
    await env.DB.prepare(
      `INSERT INTO xp_events (id, user_id, game_id, amount, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(newId("xp"), body.userId, body.gameId, body.amount, body.reason, now)
      .run();
    await env.DB.prepare(
      `UPDATE profiles SET total_xp = total_xp + ?, level = MAX(1, CAST((total_xp + ?) / 500 AS INTEGER)), updated_at = ? WHERE user_id = ?`,
    )
      .bind(body.amount, body.amount, now, body.userId)
      .run();
  }
  if (body.type === "game_ended") {
    await env.DB.prepare(
      `INSERT INTO game_results (game_id, winning_team, scores_json, summary_json, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(game_id) DO UPDATE SET winning_team = excluded.winning_team, scores_json = excluded.scores_json`,
    )
      .bind(body.gameId, body.winningTeam, JSON.stringify(body.scores), JSON.stringify({}), now)
      .run();
    await env.DB.prepare(`UPDATE games SET status = 'ended', ended_at = ? WHERE id = ?`)
      .bind(now, body.gameId)
      .run();
  }
}
