import type { Game, GameStatus, TeamColor } from "../shared/contracts/game";
import { gameStatusFromDb, teamColorFromDb } from "../shared/contracts/game";
import type { GameStatePayload } from "../shared/contracts/events";
import type { Territory, TerritoryStatus } from "../shared/contracts/territory";
import type { Objective } from "../shared/contracts/objective";
import type { Player } from "../shared/contracts/player";
import { buildTeamsFromScores, emptyScores, mapDbGame } from "../worker/lib/game-mapper";

export type InternalTerritory = {
  id: string;
  center: { lat: number; lng: number };
  polygon: [number, number][];
  ownerTeam: TeamColor | null;
  captureProgress: number;
  capturingTeam: TeamColor | null;
  health: number;
  playersInside: Set<string>;
};

export function territoryStatus(t: InternalTerritory): TerritoryStatus {
  if (t.capturingTeam && t.captureProgress > 0 && t.captureProgress < 100) return "CONTESTED";
  if (t.ownerTeam) return "CONTROLLED";
  return "NEUTRAL";
}

export function toContractTerritory(t: InternalTerritory): Territory {
  const ring = t.polygon.map(([lng, lat]) => [lng, lat]);
  if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
    ring.push(ring[0]);
  }
  return {
    id: t.id,
    polygon: { type: "Polygon", coordinates: [ring] },
    center: t.center,
    ownerTeam: t.ownerTeam,
    status: territoryStatus(t),
    captureProgress: t.captureProgress,
    contestedBy: t.capturingTeam ?? undefined,
    health: t.health,
    playersPresent: t.playersInside.size,
  };
}

export function buildContractSnapshot(args: {
  dbGame: Record<string, unknown> | null;
  gameId: string;
  status: GameStatus;
  scores: Record<TeamColor, number>;
  territoryCounts: Record<TeamColor, number>;
  playerCounts: Record<TeamColor, number>;
  territories: InternalTerritory[];
  players: Player[];
  objectives: Objective[];
}): GameStatePayload {
  const teams = buildTeamsFromScores(args.scores, args.playerCounts, args.territoryCounts);
  const baseGame: Game = args.dbGame
    ? mapDbGame(args.dbGame as never, teams)
    : {
        id: args.gameId,
        code: args.gameId === "demo_city_battle" ? "DEMO" : args.gameId.slice(0, 8),
        name: "Demo City Battle",
        mode: "CITY_BATTLE",
        status: args.status,
        creatorId: "system",
        center: { lat: 1.3521, lng: 103.8198 },
        radiusM: 5000,
        durationSeconds: 3600,
        maxPlayers: 32,
        teams,
        createdAt: new Date().toISOString(),
      };
  baseGame.status = args.status;
  baseGame.teams = teams;
  return {
    game: baseGame,
    teams,
    players: args.players,
    territories: args.territories.map(toContractTerritory),
    objectives: args.objectives,
    serverTime: new Date().toISOString(),
  };
}

export { gameStatusFromDb, teamColorFromDb };
