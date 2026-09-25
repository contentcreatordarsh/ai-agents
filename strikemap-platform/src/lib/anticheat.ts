import { haversineM } from "./geo";

const MAX_SPEED_M_S = 12;
const MAX_UPDATES_PER_MIN = 120;

export type MovementState = {
  lastLat: number;
  lastLng: number;
  lastTs: number;
  riskScore: number;
  updatesInWindow: number;
  windowStart: number;
};

export function validateMovement(
  state: MovementState,
  lat: number,
  lng: number,
  timestamp: number,
): { ok: boolean; reason?: string; next: MovementState } {
  const now = Date.now();
  let { riskScore, updatesInWindow, windowStart } = state;
  if (now - windowStart > 60_000) {
    updatesInWindow = 0;
    windowStart = now;
  }
  updatesInWindow++;
  if (updatesInWindow > MAX_UPDATES_PER_MIN) {
    riskScore = Math.min(100, riskScore + 15);
    return { ok: false, reason: "rate_limit", next: { ...state, riskScore, updatesInWindow, windowStart } };
  }

  const dtSec = Math.max(0.5, (timestamp - state.lastTs) / 1000);
  const dist = haversineM({ lat: state.lastLat, lng: state.lastLng }, { lat, lng });
  const speed = dist / dtSec;
  if (speed > MAX_SPEED_M_S) {
    riskScore = Math.min(100, riskScore + 25);
    return {
      ok: false,
      reason: "impossible_movement",
      next: { lastLat: lat, lastLng: lng, lastTs: timestamp, riskScore, updatesInWindow, windowStart },
    };
  }

  return {
    ok: true,
    next: { lastLat: lat, lastLng: lng, lastTs: timestamp, riskScore, updatesInWindow, windowStart },
  };
}
