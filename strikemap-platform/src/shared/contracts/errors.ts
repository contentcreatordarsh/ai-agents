export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "GAME_NOT_FOUND"
  | "GAME_FULL"
  | "GAME_NOT_ACTIVE"
  | "NOT_A_PLAYER"
  | "INVALID_TEAM"
  | "INVALID_LOCATION"
  | "LOCATION_TOO_INACCURATE"
  | "MOVEMENT_TOO_FAST"
  | "OUTSIDE_GAME_AREA"
  | "OBJECTIVE_NOT_FOUND"
  | "OBJECTIVE_EXPIRED"
  | "NOT_IN_RANGE"
  | "OBJECTIVE_ALREADY_CLAIMED"
  | "RATE_LIMITED"
  | "INVALID_EVENT"
  | "SERVER_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  requestId: string;
}

export type WsErrorCode = ApiErrorCode;
