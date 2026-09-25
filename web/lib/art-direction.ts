/** StrikeMap visual system tokens (Phase A). */

export const palette = {
  void: "#05070A",
  deck: "#080D12",
  signal: "#00F5D4",
  alliance: "#168CFF",
  hostile: "#FF315D",
  pulse: "#FF178B",
  ink: "#EDF5FF",
  muted: "#7A8A9E",
} as const;

export const motion = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
};

export type MapCamera = {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

export const WORLD_CAMERAS: Record<string, MapCamera> = {
  hero: { lng: 103.8198, lat: 1.3521, zoom: 11.2, pitch: 58, bearing: -18 },
  world: { lng: 103.85, lat: 1.34, zoom: 12.4, pitch: 62, bearing: 8 },
  battles: { lng: 139.69, lat: 35.68, zoom: 10.5, pitch: 50, bearing: 0 },
  territory: { lng: 103.83, lat: 1.355, zoom: 13.8, pitch: 65, bearing: -30 },
  multiplayer: { lng: -0.12, lat: 51.5, zoom: 11, pitch: 48, bearing: 12 },
  mission: { lng: 103.82, lat: 1.35, zoom: 11.8, pitch: 55, bearing: 0 },
};
