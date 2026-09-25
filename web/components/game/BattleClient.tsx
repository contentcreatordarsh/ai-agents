"use client";

import { useEffect, useState } from "react";
import GameMap from "@/components/game/GameMap";
import GameHUD from "@/components/game/GameHUD";
import GameLobby from "@/components/game/GameLobby";
import GameEndScreen from "@/components/game/GameEndScreen";
import { useGameSocket } from "@/hooks/useGameSocket";
import { api } from "@/lib/game/api";

type GameMeta = {
  game: {
    id: string;
    code: string;
    name: string;
    status: string;
    creatorId: string;
    maxPlayers: number;
    center: { lat: number; lng: number };
  };
  players: { id: string; username: string; team: "RED" | "BLUE"; status: string }[];
  playerCount: number;
};

type Props = {
  gameId: string;
  demo?: boolean;
};

export default function BattleClient({ gameId, demo }: Props) {
  const [ready, setReady] = useState(demo ?? false);
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { snapshot, status, events, finished, sendSimulatedMove } = useGameSocket({
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
    void (async () => {
      try {
        const profile = await api<{ profile: { id: string } }>("/api/v1/profile/me");
        setUserId(profile.profile.id);
      } catch {
        /* auth optional for spectate */
      }
      const data = await api<GameMeta>(`/api/v1/games/${gameId}`);
      setMeta(data);
      setReady(true);
    })();
    const poll = setInterval(() => {
      void api<GameMeta>(`/api/v1/games/${gameId}`).then(setMeta).catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [demo, gameId]);

  async function startGame() {
    await api(`/api/v1/games/${gameId}/start`, { method: "POST", body: "{}" });
  }

  const gameStatus = snapshot?.game.status ?? meta?.game.status ?? "LOBBY";
  const isHost = userId && meta?.game.creatorId === userId;
  const center = meta?.game.center ?? { lat: 1.3521, lng: 103.8198 };

  function nudge(dir: "n" | "s" | "e" | "w") {
    const me = snapshot?.players.find((p) => p.id === userId);
    const base = me?.location ?? center;
    const step = 0.00015;
    const lat = dir === "n" ? base.lat + step : dir === "s" ? base.lat - step : base.lat;
    const lng = dir === "e" ? base.lng + step : dir === "w" ? base.lng - step : base.lng;
    sendSimulatedMove(lat, lng);
  }

  return (
    <div className="battle-shell">
      <GameMap snapshot={snapshot} center={center} />
      {gameStatus !== "LOBBY" && gameStatus !== "FINISHED" ? (
        <GameHUD snapshot={snapshot} status={status} events={events} />
      ) : null}
      {gameStatus === "LOBBY" && meta ? (
        <GameLobby
          name={meta.game.name}
          code={meta.game.code}
          players={meta.players}
          maxPlayers={meta.game.maxPlayers}
          isHost={!!isHost}
          onStart={() => void startGame()}
        />
      ) : null}
      {finished ? <GameEndScreen winner={finished.winner} scores={finished.scores} /> : null}
      {gameStatus === "ACTIVE" ? (
        <div className="sim-panel glass">
          <span>SIMULATION</span>
          <div className="pad">
            <button type="button" onClick={() => nudge("n")}>↑</button>
            <div>
              <button type="button" onClick={() => nudge("w")}>←</button>
              <button type="button" onClick={() => nudge("e")}>→</button>
            </div>
            <button type="button" onClick={() => nudge("s")}>↓</button>
          </div>
        </div>
      ) : null}
      <style jsx>{`
        .sim-panel {
          position: absolute;
          right: 0.75rem;
          bottom: 5rem;
          z-index: 4;
          padding: 0.5rem;
          font-size: 0.7rem;
          color: var(--neon-amber);
          text-align: center;
        }
        .pad button {
          margin: 0.15rem;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 8px;
          border: 1px solid var(--paper-border);
          background: #111;
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}
