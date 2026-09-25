import type { TeamColor } from "./game";

export type TerritoryStatus = "NEUTRAL" | "CONTROLLED" | "CONTESTED";

export interface Territory {
  id: string;
  polygon: { type: "Polygon"; coordinates: number[][][] };
  center: { lat: number; lng: number };
  ownerTeam: TeamColor | null;
  status: TerritoryStatus;
  captureProgress: number;
  contestedBy?: TeamColor;
  health: number;
  playersPresent: number;
}
