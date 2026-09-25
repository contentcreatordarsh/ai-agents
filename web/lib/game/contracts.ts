export const WS_PROTOCOL_VERSION = "STRIKEMAP_GAME_V1";

export type TeamColor = "RED" | "BLUE" | "PURPLE" | "GREEN";

export const TEAM_COLORS: Record<TeamColor, string> = {
  RED: "#ff3355",
  BLUE: "#3388ff",
  PURPLE: "#b366ff",
  GREEN: "#33ff99",
};

export type GameMessage<T = unknown> = {
  type: string;
  eventId: string;
  serverTime: string;
  gameId: string;
  sequence: number;
  payload: T;
};

export type GameStatePayload = {
  game: {
    id: string;
    code: string;
    status: string;
    endsAt?: string;
  };
  players: Array<{
    id: string;
    username: string;
    team: TeamColor;
    location?: { lat: number; lng: number };
  }>;
  teams: Array<{ color: TeamColor; score: number }>;
  territories: Array<{
    id: string;
    ownerTeam: TeamColor | null;
    polygon: GeoJSON.Polygon;
    captureProgress: number;
  }>;
  objectives: Array<{ id: string; title: string; rewardXp: number }>;
  serverTime: string;
};
