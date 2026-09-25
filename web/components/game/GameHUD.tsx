"use client";

import type { GameStatePayload } from "@/lib/game/contracts";
import { TEAM_COLORS, type TeamColor } from "@/lib/game/contracts";
import type { ConnStatus } from "@/hooks/useGameSocket";

type Props = {
  snapshot: GameStatePayload | null;
  status: ConnStatus;
  events: string[];
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GameHUD({ snapshot, status, events }: Props) {
  const statusLabel =
    status === "live" ? "🟢 LIVE" : status === "reconnecting" ? "🟡 RECONNECTING" : "🔴 OFFLINE";
  const endsAt = snapshot?.game.endsAt ? Date.parse(snapshot.game.endsAt) : 0;
  const remaining = endsAt ? Math.max(0, Math.floor((endsAt - Date.now()) / 1000)) : 0;
  const demo = snapshot?.game.code === "DEMO" || snapshot?.game.id === "demo_city_battle";

  return (
    <div className="hud">
      <header className="hud-top glass">
        <div>
          <span className="brand-font">⚔️ CITY BATTLE</span>
          {demo ? <span className="demo-pill">DEMO MODE</span> : null}
        </div>
        <div className="scores">
          {(["RED", "BLUE"] as const).map((color) => {
            const t = snapshot?.teams.find((x) => x.color === color);
            return (
              <span key={color} style={{ color: TEAM_COLORS[color] }}>
                {color === "RED" ? "🔴" : "🔵"} {(t?.score ?? 0).toLocaleString()}
              </span>
            );
          })}
        </div>
        <div className="timer">
          ⏱ {formatTime(remaining)} · {statusLabel}
        </div>
      </header>
      <footer className="hud-bottom glass">
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
    </div>
  );
}
