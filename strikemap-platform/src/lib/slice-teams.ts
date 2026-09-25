import type { Team } from "../shared/contracts/game";
import { SLICE_TEAM_COLORS, type SliceTeamColor } from "./slice";

export function buildSliceTeams(
  scores: Record<SliceTeamColor, number>,
  playerCounts: Record<SliceTeamColor, number>,
  territoryCounts: Record<SliceTeamColor, number>,
): Team[] {
  return SLICE_TEAM_COLORS.map((color) => ({
    id: `team_${color}`,
    color,
    name: color,
    playerCount: playerCounts[color] ?? 0,
    score: scores[color] ?? 0,
    territoriesControlled: territoryCounts[color] ?? 0,
  }));
}
