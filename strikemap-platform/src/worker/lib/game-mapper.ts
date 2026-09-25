import type { Game, Team, TeamColor } from "../../shared/contracts/game";
import { ALL_TEAM_COLORS, gameStatusFromDb, teamColorFromDb } from "../../shared/contracts/game";
import type { Territory } from "../../shared/contracts/territory";
import type { Objective } from "../../shared/contracts/objective";
import type { Player } from "../../shared/contracts/player";

type DbGame = {
  id: string;
  join_code: string;
  host_user_id: string;
  mode: string;
  status: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  duration_sec: number;
  max_players: number;
  location_name: string | null;
  started_at: number | null;
  ended_at: number | null;
  created_at: number;
};

export function buildTeamsFromScores(
  scores: Record<TeamColor, number>,
  playerCounts: Record<TeamColor, number>,
  territoryCounts: Record<TeamColor, number>,
): Team[] {
  return ALL_TEAM_COLORS.map((color) => ({
    id: `team_${color}`,
    color,
    name: color,
    playerCount: playerCounts[color] ?? 0,
    score: scores[color] ?? 0,
    territoriesControlled: territoryCounts[color] ?? 0,
  }));
}

export function mapDbGame(row: DbGame, teams: Team[]): Game {
  return {
    id: row.id,
    code: row.join_code,
    name: row.location_name ?? "City Battle",
    mode: "CITY_BATTLE",
    status: gameStatusFromDb(row.status),
    creatorId: row.host_user_id,
    center: { lat: row.center_lat, lng: row.center_lng },
    radiusM: row.radius_m,
    durationSeconds: row.duration_sec,
    maxPlayers: row.max_players,
    teams,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    finishedAt: row.ended_at ? new Date(row.ended_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function emptyScores(): Record<TeamColor, number> {
  return { RED: 0, BLUE: 0, PURPLE: 0, GREEN: 0 };
}

export function mapPlayerRow(
  userId: string,
  username: string,
  team: string,
  level: number,
  xp: number,
  stats: { wins: number; games_played: number; captures: number; win_streak: number },
): Player {
  return {
    id: userId,
    username,
    team: teamColorFromDb(team),
    level,
    xp,
    status: "ONLINE",
    stats: {
      wins: stats.wins,
      gamesPlayed: stats.games_played,
      territoriesCaptured: stats.captures,
      currentStreak: stats.win_streak,
    },
  };
}

export type { Territory, Objective, Player };
