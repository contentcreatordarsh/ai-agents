export type TeamColor = "RED" | "BLUE" | "PURPLE" | "GREEN";

export const TEAM_COLORS: Record<TeamColor, string> = {
  RED: "#ff3d57",
  BLUE: "#3d8bff",
  PURPLE: "#b84dff",
  GREEN: "#3dffa8",
};

export const ALL_TEAM_COLORS: TeamColor[] = ["RED", "BLUE", "PURPLE", "GREEN"];

export type GameStatus = "LOBBY" | "COUNTDOWN" | "ACTIVE" | "FINISHED" | "CANCELLED";

export type GameMode = "CITY_BATTLE";

export interface Team {
  id: string;
  color: TeamColor;
  name: string;
  playerCount: number;
  score: number;
  territoriesControlled: number;
}

export interface Game {
  id: string;
  code: string;
  name: string;
  mode: GameMode;
  status: GameStatus;
  creatorId: string;
  center: { lat: number; lng: number };
  radiusM: number;
  durationSeconds: number;
  maxPlayers: number;
  teams: Team[];
  startedAt?: string;
  endsAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export function teamColorFromDb(team: string): TeamColor {
  const u = team.toUpperCase() as TeamColor;
  if (ALL_TEAM_COLORS.includes(u)) return u;
  return "BLUE";
}

export function teamColorToDb(team: TeamColor): string {
  return team.toLowerCase();
}

export function gameStatusFromDb(status: string): GameStatus {
  const map: Record<string, GameStatus> = {
    lobby: "LOBBY",
    countdown: "COUNTDOWN",
    active: "ACTIVE",
    ended: "FINISHED",
    finished: "FINISHED",
    cancelled: "CANCELLED",
    LOBBY: "LOBBY",
    COUNTDOWN: "COUNTDOWN",
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED",
    CANCELLED: "CANCELLED",
  };
  return map[status] ?? "LOBBY";
}

export function gameStatusToDb(status: GameStatus): string {
  return status.toLowerCase();
}
