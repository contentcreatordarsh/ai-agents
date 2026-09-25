"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DEMO_GAME_STATE, type GameStateV1 } from "@/lib/game-state";
import { useSiteUI } from "@/components/site/SiteUIContext";

const BattleClient = dynamic(() => import("@/components/game/BattleClient"), { ssr: false });

/** Full-screen demo: animated UI + optional live DO via BattleClient layer */
export default function GameConsole() {
  const { close } = useSiteUI();
  const [state, setState] = useState<GameStateV1>(DEMO_GAME_STATE);
  const [flash, setFlash] = useState<string | null>(null);
  const [useLive, setUseLive] = useState(false);
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    if (useLive) return;
    const cap = setInterval(() => {
      setState((s) => {
        const t = s.territories[0];
        if (!t || t.captureProgress >= 100) return s;
        const next = Math.min(100, t.captureProgress + 4);
        const territories = [{ ...t, captureProgress: next }];
        if (next >= 100) {
          setFlash("SECTOR CAPTURED · BLUE +250");
          return {
            ...s,
            territories: [{ ...t, captureProgress: 100, ownerTeam: "BLUE", status: "CONTROLLED" }],
            teams: [
              { ...s.teams[0], score: 500 },
              { ...s.teams[1], score: 1000 },
            ],
          };
        }
        return { ...s, territories };
      });
    }, 500);
    const clk = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => {
      clearInterval(cap);
      clearInterval(clk);
    };
  }, [useLive]);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");
  const cap = state.territories[0]?.captureProgress ?? 0;

  return (
    <div className="game-console">
      <header className="console-top">
        <span>STRIKEMAP / LIVE BATTLE</span>
        <span className="console-timer">{mm}:{ss}</span>
        <button type="button" className="modal-close" onClick={close} aria-label="Close demo">×</button>
      </header>
      <div className="console-main">
        {useLive ? (
          <BattleClient gameId="demo_city_battle" demo />
        ) : (
          <>
            <div className="console-map">
              <div className="console-sector">SECTOR 01</div>
              <div className="console-bar"><span style={{ width: `${cap}%` }} /></div>
              <div className="console-markers">
                <span className="red">🔴 YOU</span>
                <span className="blue">🔵 PLAYER_02</span>
              </div>
            </div>
            <aside className="console-panel">
              <h3>BATTLE STATUS</h3>
              <p className="red">RED {state.teams[0]?.score ?? 0}</p>
              <p className="blue">BLUE {state.teams[1]?.score ?? 0}</p>
              <p>SECTOR 01 · {cap}%</p>
              <h4>PLAYERS</h4>
              <ul>
                {state.players.map((p) => (
                  <li key={p.id}>{p.username}</li>
                ))}
              </ul>
              <p>GPS · {state.gpsLocked ? "LOCKED" : "—"}</p>
              <p>WS · {state.wsConnected ? "CONNECTED" : "—"}</p>
              {flash ? <p className="flash">{flash}</p> : null}
              <button type="button" className="btn-outline full" onClick={() => setUseLive(true)}>
                CONNECT LIVE DO
              </button>
            </aside>
          </>
        )}
      </div>
      <p className="demo-label">DEMONSTRATION · Simulated values unless live DO connected</p>
    </div>
  );
}
