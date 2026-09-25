"use client";

import { useEffect, useState } from "react";
import GameMap from "@/components/game/GameMap";
import GameHUD from "@/components/game/GameHUD";
import { useGameSocket } from "@/hooks/useGameSocket";
import { api } from "@/lib/game/api";

type Props = {
  gameId: string;
  demo?: boolean;
};

export default function BattleClient({ gameId, demo }: Props) {
  const [ready, setReady] = useState(demo ?? false);
  const { snapshot, status, events } = useGameSocket({
    gameId,
    demo,
    enabled: ready,
  });

  useEffect(() => {
    if (demo) {
      void api("/api/v1/games/demo/init", { method: "POST", body: "{}" }).then(() =>
        setReady(true),
      );
      return;
    }
    setReady(true);
  }, [demo]);

  async function startGame() {
    await api(`/api/v1/games/${gameId}/start`, { method: "POST", body: "{}" });
  }

  return (
    <div className="battle-shell">
      <GameMap snapshot={snapshot} />
      <GameHUD snapshot={snapshot} status={status} events={events} />
      {!demo && snapshot?.game.status === "LOBBY" ? (
        <button type="button" className="start-btn" onClick={() => void startGame()}>
          Start battle
        </button>
      ) : null}
      <style jsx>{`
        .start-btn {
          position: absolute;
          left: 50%;
          bottom: 42%;
          transform: translateX(-50%);
          z-index: 3;
          padding: 0.75rem 1.25rem;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          background: linear-gradient(135deg, #ff00aa, #00ffd5);
          color: #041018;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
