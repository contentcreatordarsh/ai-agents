import type { TeamColor } from "./game";

export type PlayerStatus = "ONLINE" | "OFFLINE" | "DISCONNECTED";

export interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  team: TeamColor;
  level: number;
  xp: number;
  status: PlayerStatus;
  location?: {
    lat: number;
    lng: number;
    accuracyM?: number;
    updatedAt: string;
  };
  stats: {
    wins: number;
    gamesPlayed: number;
    territoriesCaptured: number;
    currentStreak: number;
  };
}

export interface PublicPlayerLocation {
  playerId: string;
  team: TeamColor;
  location: { lat: number; lng: number };
  accuracyBucket: "HIGH" | "MEDIUM" | "LOW";
  updatedAt: string;
}
