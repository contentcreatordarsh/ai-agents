import type { TeamColor } from "./game";

export type ObjectiveType = "CAPTURE" | "DEFEND" | "SUPPLY_DROP" | "HIGH_VALUE";

export interface Objective {
  id: string;
  type: ObjectiveType;
  title: string;
  description: string;
  location: { lat: number; lng: number };
  radiusM: number;
  rewardXp: number;
  rewardCredits?: number;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  expiresAt: string;
  targetTeam?: TeamColor;
  completedBy?: string;
}
