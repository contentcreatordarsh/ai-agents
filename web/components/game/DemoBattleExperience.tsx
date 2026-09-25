"use client";

import { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import { useSiteUI } from "@/components/site/SiteUIContext";
import { playUiTick } from "@/lib/sound-ui";

const BattleClient = dynamic(() => import("@/components/game/BattleClient"), { ssr: false });

type Phase =
  | "countdown"
  | "moving"
  | "enter"
  | "capture"
  | "contested"
  | "capture_resume"
  | "captured"
  | "endgame";

type SimState = {
  phase: Phase;
  countdown: number;
  capture: number;
  redScore: number;
  blueScore: number;
  timer: number;
  banner: string | null;
};

const initial: SimState = {
  phase: "countdown",
  countdown: 3,
  capture: 0,
  redScore: 500,
  blueScore: 750,
  timer: 300,
  banner: null,
};

function reducer(state: SimState, action: { type: string; payload?: Partial<SimState> }): SimState {
  if (action.type === "decrement_timer") {
    return { ...state, timer: Math.max(0, state.timer - 1) };
  }
  return { ...state, ...action.payload };
}

/** Scripted playable-feeling demo — replace state with WebSocket `GameStateV1` later. */
export default function DemoBattleExperience() {
  const { close } = useSiteUI();
  const [state, dispatch] = useReducer(reducer, initial);
  const [useLive, setUseLive] = useState(false);

  useEffect(() => {
    if (useLive) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      dispatch({ type: "tick", payload: { banner: "DEPLOYING TO SECTOR 01" } });
      await wait(800);
      for (let c = 3; c >= 1; c--) {
        if (cancelled) return;
        dispatch({ type: "tick", payload: { phase: "countdown", countdown: c, banner: String(c) } });
        playUiTick();
        await wait(900);
      }
      dispatch({ type: "tick", payload: { phase: "moving", banner: "PLAYER MOVING" } });
      await wait(1200);
      dispatch({ type: "tick", payload: { phase: "enter", banner: "ENTER TERRITORY" } });
      await wait(1000);
      dispatch({ type: "tick", payload: { phase: "capture", banner: "CAPTURE INITIATED" } });

      for (const pct of [12, 24, 47, 58]) {
        if (cancelled) return;
        dispatch({ type: "tick", payload: { capture: pct } });
        await wait(700);
      }

      dispatch({ type: "tick", payload: { phase: "contested", banner: "CONTESTED" } });
      await wait(1600);

      dispatch({ type: "tick", payload: { phase: "capture_resume", banner: "ENEMY RETREATED" } });
      for (const pct of [72, 91, 100]) {
        if (cancelled) return;
        dispatch({ type: "tick", payload: { capture: pct } });
        await wait(650);
      }

      dispatch({
        type: "tick",
        payload: {
          phase: "captured",
          banner: "SECTOR CAPTURED · +250",
          redScore: 750,
          blueScore: 750,
        },
      });
      await wait(1400);
      dispatch({
        type: "tick",
        payload: {
          phase: "endgame",
          banner: "BATTLE COMPLETE",
          redScore: 2750,
          blueScore: 2250,
        },
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot story on mount
  }, [useLive]);

  useEffect(() => {
    if (useLive) return;
    const clk = setInterval(() => dispatch({ type: "decrement_timer" }), 1000);
    return () => clearInterval(clk);
  }, [useLive]);

  const mm = String(Math.floor(state.timer / 60)).padStart(2, "0");
  const ss = String(state.timer % 60).padStart(2, "0");
  const contested = state.phase === "contested";

  if (useLive) {
    return (
      <div className="game-console">
        <header className="console-top">
          <span>STRIKEMAP / LIVE BATTLE</span>
          <button type="button" className="modal-close" onClick={close} aria-label="Close demo">×</button>
        </header>
        <BattleClient gameId="demo_city_battle" demo />
      </div>
    );
  }

  return (
    <div className={`game-console ${contested ? "is-contested" : ""}`}>
      <header className="console-top">
        <span>STRIKEMAP / LIVE BATTLE</span>
        <span className="console-timer">{mm}:{ss}</span>
        <button type="button" className="modal-close" onClick={close} aria-label="Close demo">×</button>
      </header>

      {state.phase === "countdown" && state.banner && state.banner.length <= 2 ? (
        <div className="deploy-countdown" aria-live="polite">{state.banner}</div>
      ) : null}

      <div className="console-main">
        <div className="console-map tactical">
          <div className="console-sector">SECTOR 01</div>
          <div className={`console-bar ${contested ? "contested" : ""}`}>
            <span style={{ width: `${state.capture}%` }} />
          </div>
          <p className="capture-label">
            {contested ? "CONTESTED" : state.capture > 0 && state.capture < 100 ? "CAPTURING" : state.capture >= 100 ? "CONTROLLED" : "SCANNING"}
          </p>
          <div className="console-markers">
            <span className="red">YOU</span>
            <span className="blue">PLAYER_02</span>
          </div>
          {state.banner && state.phase !== "countdown" ? <p className="flash">{state.banner}</p> : null}
        </div>
        <aside className="console-panel">
          <h3>BATTLE STATUS</h3>
          <p className="red">RED {state.redScore}</p>
          <p className="blue">BLUE {state.blueScore}</p>
          <p>SECTOR 01 · {state.capture}%</p>
          <h4>PLAYERS</h4>
          <ul>
            <li>YOU</li>
            <li>PLAYER_02</li>
            <li>PLAYER_03</li>
          </ul>
          <p>GPS · LOCKED</p>
          <p>WS · CONNECTED</p>
          {state.phase === "endgame" ? (
            <div className="endgame-panel">
              <p className="endgame-title">BATTLE COMPLETE</p>
              <p className="red big">RED {state.redScore}</p>
              <p className="blue big">BLUE {state.blueScore}</p>
              <p className="sectors-won">3 SECTORS CAPTURED</p>
              <button type="button" className="btn-cta full" onClick={close}>RETURN TO WORLD</button>
              <button type="button" className="btn-outline full" onClick={() => window.location.reload()}>
                PLAY AGAIN
              </button>
            </div>
          ) : (
            <button type="button" className="btn-outline full" onClick={() => setUseLive(true)}>
              CONNECT LIVE DO
            </button>
          )}
        </aside>
      </div>
      <p className="demo-label">DEMONSTRATION · Simulated battle loop — live DO optional</p>
    </div>
  );
}
