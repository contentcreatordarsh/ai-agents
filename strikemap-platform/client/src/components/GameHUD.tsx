import type { GameSnapshot, TeamId } from "../types/game";
import { TEAM_COLORS } from "../types/game";
import type { ConnStatus } from "../hooks/useGameSocket";

type Props = {
  snapshot: GameSnapshot | null;
  status: ConnStatus;
  events: string[];
  playerXp?: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameHUD({ snapshot, status, events, playerXp }: Props) {
  const scores = snapshot?.scores;
  const statusLabel =
    status === "live" ? "🟢 LIVE" : status === "reconnecting" ? "🟡 RECONNECTING" : "🔴 OFFLINE";

  return (
    <div className="hud">
      <header className="hud-top glass">
        <div>
          <span className="brand-font">⚔️ CITY BATTLE</span>
          {snapshot?.demo ? <span className="demo-pill">DEMO</span> : null}
        </div>
        <div className="scores">
          {(Object.keys(TEAM_COLORS) as TeamId[]).map((t) => (
            <span key={t} style={{ color: TEAM_COLORS[t] }}>
              {scores ? scores[t].toLocaleString() : "—"}
            </span>
          ))}
        </div>
        <div className="timer">
          ⏱ {snapshot ? formatTime(snapshot.timeRemainingSec) : "--:--"} · {statusLabel}
        </div>
      </header>

      <footer className="hud-bottom glass">
        <div className="xp">⚡ {(playerXp ?? 0).toLocaleString()} XP</div>
        <div className="objectives">
          <strong>🎯 OBJECTIVES</strong>
          {(snapshot?.objectives ?? []).slice(0, 3).map((o) => (
            <div key={o.id}>
              📦 {o.title} · +{o.rewardXp} XP
            </div>
          ))}
          {!snapshot?.objectives?.length ? <div className="muted">Scanning sector…</div> : null}
        </div>
        <div className="feed">
          {events.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      </footer>
      <style>{`
        .hud { pointer-events: none; position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 0.75rem; z-index: 2; }
        .hud-top, .hud-bottom { pointer-events: auto; padding: 0.65rem 0.85rem; }
        .hud-top { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; }
        .scores { display: flex; gap: 0.65rem; font-weight: 700; font-size: 0.95rem; }
        .timer { color: var(--muted); font-size: 0.85rem; }
        .demo-pill { margin-left: 0.5rem; background: var(--neon-magenta); color: #fff; padding: 0.1rem 0.45rem; border-radius: 6px; font-size: 0.65rem; }
        .hud-bottom { display: grid; gap: 0.35rem; font-size: 0.85rem; max-height: 38vh; overflow: auto; }
        .xp { font-size: 1.1rem; font-weight: 700; color: var(--neon-cyan); }
        .objectives strong { display: block; margin-bottom: 0.25rem; }
        .muted { color: var(--muted); }
        .feed { color: var(--neon-amber); font-size: 0.78rem; }
      `}</style>
    </div>
  );
}
