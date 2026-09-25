import type { Game } from "./game";
import type { Player } from "./player";
import type { ApiErrorBody } from "./errors";
import type { GameStatePayload } from "./events";
import type { TeamColor } from "./game";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: ApiErrorBody };

export type CreateGameRequest = {
  name: string;
  mode: "CITY_BATTLE";
  center: { lat: number; lng: number };
  radiusM: number;
  durationSeconds: number;
  teamCount: number;
  maxPlayers: number;
};

export type CreateGameResponse = ApiSuccess<{
  game: { id: string; code: string; status: Game["status"] };
}>;

export type JoinGameRequest = { team?: TeamColor };

export type JoinGameResponse = ApiSuccess<{
  player: { id: string; team: TeamColor };
  game: { id: string; status: Game["status"] };
}>;

export type StartGameResponse = ApiSuccess<{
  status: "COUNTDOWN";
  countdownSeconds: number;
}>;

export type GameStateResponse = ApiSuccess<GameStatePayload & { playerCount?: number }>;

export type ProfileMeResponse = ApiSuccess<{
  profile: {
    id: string;
    username: string;
    level: number;
    xp: number;
    wins: number;
    gamesPlayed: number;
    territoriesCaptured: number;
    currentStreak: number;
    avatarUrl: string | null;
  };
}>;

export type RealtimeConnectResponse = ApiSuccess<{
  token: string;
  expiresAt: string;
  protocol: string;
}>;
