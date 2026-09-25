import { hexPolygon } from "./hex";

/** Vertical-slice teams only (2–8 players). */
export const SLICE_TEAM_COLORS = ["RED", "BLUE"] as const;
export type SliceTeamColor = (typeof SLICE_TEAM_COLORS)[number];

export function emptySliceScores(): Record<SliceTeamColor, number> {
  return { RED: 0, BLUE: 0 };
}

/** Single capture target for the MVP slice. */
export function createSector01(centerLat: number, centerLng: number, sizeM = 120) {
  const center = { lat: centerLat, lng: centerLng };
  return {
    id: "sector_01",
    center,
    polygon: hexPolygon(center, sizeM),
  };
}

export function pickSliceTeam(counts: { red: number; blue: number }): SliceTeamColor {
  if (counts.red <= counts.blue) return "RED";
  return "BLUE";
}
