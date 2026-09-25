export type TeamId = "red" | "blue" | "purple" | "green";

export const TEAMS: TeamId[] = ["red", "blue", "purple", "green"];

export const TEAM_COLORS: Record<TeamId, string> = {
  red: "#ff3d57",
  blue: "#3d8bff",
  purple: "#b84dff",
  green: "#3dffa8",
};

export type GameStatus = "lobby" | "countdown" | "active" | "ended";

export type WsClientMessage =
  | { type: "player_move"; lat: number; lng: number; timestamp: number; accuracyM?: number }
  | { type: "ping"; t: number };

export type WsServerMessage =
  | { type: "welcome"; playerId: string; gameId: string; team: TeamId; demo: boolean }
  | { type: "state"; state: GameSnapshot }
  | { type: "event"; event: GameEvent }
  | { type: "countdown"; n: number }
  | { type: "strike" }
  | { type: "error"; message: string }
  | { type: "pong"; t: number };

export type TerritorySnapshot = {
  id: string;
  center: { lat: number; lng: number };
  polygon: [number, number][];
  ownerTeam: TeamId | null;
  captureProgress: number;
  capturingTeam: TeamId | null;
  health: number;
};

export type PlayerSnapshot = {
  id: string;
  username: string;
  team: TeamId;
  position: { lat: number; lng: number } | null;
  demo: boolean;
  xp: number;
  riskScore: number;
};

export type ObjectiveSnapshot = {
  id: string;
  kind: "supply_drop" | "defend" | "attack";
  title: string;
  lat: number;
  lng: number;
  rewardXp: number;
  expiresAt: number | null;
};

export type GameSnapshot = {
  gameId: string;
  status: GameStatus;
  timeRemainingSec: number;
  scores: Record<TeamId, number>;
  territories: TerritorySnapshot[];
  players: PlayerSnapshot[];
  objectives: ObjectiveSnapshot[];
  demo: boolean;
};

export type GameEvent =
  | { kind: "territory_captured"; territoryId: string; team: TeamId; xp: number }
  | { kind: "supply_drop"; title: string; lat: number; lng: number }
  | { kind: "narration"; text: string }
  | { kind: "player_flagged"; playerId: string; reason: string };
