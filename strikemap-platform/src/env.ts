import type { D1Database, DurableObjectNamespace, KVNamespace, Queue, R2Bucket, Ai } from "@cloudflare/workers-types";
import type { StrikeGameDO } from "./durable-objects/StrikeGame";

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS_BUCKET: R2Bucket;
  STRIKE_GAME: DurableObjectNamespace<StrikeGameDO>;
  GAME_EVENTS: Queue<GameQueueMessage>;
  AI: Ai;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  PUBLIC_APP_URL: string;
  SESSION_SECRET?: string;
  TURNSTILE_SECRET?: string;
};

export type GameQueueMessage =
  | { type: "territory_captured"; gameId: string; territoryId: string; team: string; at: number }
  | { type: "xp_award"; userId: string; gameId: string; amount: number; reason: string; at: number }
  | { type: "game_ended"; gameId: string; winningTeam: string; scores: Record<string, number>; at: number };
