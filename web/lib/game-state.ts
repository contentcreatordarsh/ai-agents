/** Frontend game state — aligns with StrikeMap v1 WebSocket payloads. */

export type TeamId = "RED" | "BLUE";

export type GamePlayer = {
  id: string;
  username: string;
  team: TeamId;
  status: "ONLINE" | "OFFLINE" | "DISCONNECTED";
  location?: { lat: number; lng: number };
};

export type TeamState = {
  color: TeamId;
  score: number;
  playerCount: number;
};

export type TerritoryState = {
  id: string;
  label: string;
  ownerTeam: TeamId | null;
  status: "NEUTRAL" | "CONTROLLED" | "CONTESTED";
  captureProgress: number;
};

export type GameStateV1 = {
  gameId: string;
  code: string;
  status: "LOBBY" | "COUNTDOWN" | "ACTIVE" | "FINISHED";
  sector: string;
  teams: TeamState[];
  players: GamePlayer[];
  territories: TerritoryState[];
  endsAtMs?: number;
  wsConnected: boolean;
  gpsLocked: boolean;
};

export const DEMO_GAME_STATE: GameStateV1 = {
  gameId: "demo_city_battle",
  code: "DEMO",
  status: "ACTIVE",
  sector: "SINGAPORE SECTOR",
  teams: [
    { color: "RED", score: 500, playerCount: 9 },
    { color: "BLUE", score: 750, playerCount: 9 },
  ],
  players: [
    { id: "you", username: "YOU", team: "RED", status: "ONLINE" },
    { id: "p2", username: "PLAYER_02", team: "BLUE", status: "ONLINE" },
    { id: "p3", username: "PLAYER_03", team: "RED", status: "ONLINE" },
  ],
  territories: [
    {
      id: "sector_01",
      label: "SECTOR 01",
      ownerTeam: null,
      status: "NEUTRAL",
      captureProgress: 64,
    },
  ],
  wsConnected: true,
  gpsLocked: true,
};
