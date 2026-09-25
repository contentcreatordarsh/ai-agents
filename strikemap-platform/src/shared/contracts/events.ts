import type { Game, Team } from "./game";
import type { Objective } from "./objective";
import type { Territory } from "./territory";
import type { Player, PublicPlayerLocation } from "./player";
import type { TeamColor } from "./game";

export const WS_PROTOCOL_VERSION = "STRIKEMAP_GAME_V1";

export type GameEventType =
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "PLAYER_MOVED"
  | "GAME_STARTED"
  | "GAME_FINISHED"
  | "TERRITORY_CONTESTED"
  | "TERRITORY_CAPTURED"
  | "OBJECTIVE_CREATED"
  | "OBJECTIVE_COMPLETED"
  | "SUPPLY_DROP_CREATED"
  | "SUPPLY_DROP_CLAIMED"
  | "SCORE_UPDATED"
  | "XP_AWARDED"
  | "PLAYER_LEVEL_UP"
  | "NOTIFICATION"
  | "GAME_STATE"
  | "PLAYER_STATUS_CHANGED"
  | "GAME_COUNTDOWN"
  | "TERRITORY_UPDATED"
  | "TERRITORY_CAPTURE_STARTED"
  | "OBJECTIVE_UPDATED"
  | "LEVEL_UP"
  | "ERROR"
  | "PONG";

export type ClientGameplayEventType =
  | "PLAYER_MOVE"
  | "PING"
  | "CLAIM_OBJECTIVE"
  | "CLAIM_SUPPLY_DROP"
  | "REQUEST_SNAPSHOT";

export interface GameMessage<T = unknown> {
  type: GameEventType | ClientGameplayEventType;
  eventId: string;
  serverTime: string;
  gameId: string;
  sequence: number;
  payload: T;
}

export interface GameStatePayload {
  game: Game;
  teams: Team[];
  players: Player[];
  territories: Territory[];
  objectives: Objective[];
  serverTime: string;
}

export interface PlayerMoveClientPayload {
  lat: number;
  lng: number;
  accuracyM?: number;
  timestamp: string;
}

export interface PlayerMovedPayload {
  playerId: string;
  location: { lat: number; lng: number };
  team: TeamColor;
  updatedAt: string;
}

export interface ScoreUpdatedPayload {
  scores: Record<TeamColor, number>;
}

export interface QueuePersistenceEvent {
  eventType: string;
  gameId: string;
  eventId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}
