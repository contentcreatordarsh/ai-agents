export type StrikeEvent = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  severity: "high" | "medium" | "low";
  reportedAt: string;
  source: string;
};

/** Demo OSINT-style points (fictional coordinates for UI scaffold). */
export const DEMO_EVENTS: StrikeEvent[] = [
  {
    id: "evt-1",
    title: "Reported air activity — sector north",
    lat: 32.08,
    lng: 34.78,
    severity: "high",
    reportedAt: "2026-09-25T06:30:00.000Z",
    source: "OSINT feed (demo)",
  },
  {
    id: "evt-2",
    title: "NOTAM corridor watch",
    lat: 31.5,
    lng: 35.0,
    severity: "medium",
    reportedAt: "2026-09-25T06:00:00.000Z",
    source: "Aviation (demo)",
  },
  {
    id: "evt-3",
    title: "Thermal anomaly — open source",
    lat: 33.31,
    lng: 44.36,
    severity: "medium",
    reportedAt: "2026-09-25T05:15:00.000Z",
    source: "Satellite (demo)",
  },
  {
    id: "evt-4",
    title: "Intercept alert — multilingual feed",
    lat: 29.56,
    lng: 34.95,
    severity: "low",
    reportedAt: "2026-09-25T04:45:00.000Z",
    source: "Alert bot (demo)",
  },
];
