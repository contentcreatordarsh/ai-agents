import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { GameMap } from "../components/GameMap";
import { GameHUD } from "../components/GameHUD";
import { useGameSocket } from "../hooks/useGameSocket";
import { api } from "../lib/api";
import type { TeamId } from "../types/game";

export function GamePage({ demo = false }: { demo?: boolean }) {
  const { gameId } = useParams();
  const [params] = useSearchParams();
  const team = (params.get("team") ?? "blue") as TeamId;
  const isHost = params.get("host") === "1";
  const id = demo ? "demo_city_battle" : gameId!;
  const [started, setStarted] = useState(demo || !isHost);

  useEffect(() => {
    if (demo) {
      void api("/api/v1/games/demo/init", { method: "POST", body: "{}" });
      setStarted(true);
      return;
    }
  }, [demo]);

  const { snapshot, status, events } = useGameSocket({
    gameId: id,
    demo,
    enabled: started,
  });

  const startBattle = async () => {
    await api(`/api/v1/games/${id}/start`, { method: "POST", body: "{}" });
    setStarted(true);
  };

  const playerXp = useMemo(() => {
    if (!snapshot) return 0;
    const me = snapshot.players.find((p) => p.team === team);
    return me?.xp ?? snapshot.players[0]?.xp ?? 0;
  }, [snapshot, team]);

  return (
    <div className="game-shell">
      {!started && isHost && (
        <div className="overlay glass">
          <h2 className="brand-font">Lobby ready</h2>
          <p>Share join code: <strong>{params.get("code")}</strong></p>
          <button className="btn-primary" onClick={startBattle}>Start City Battle</button>
        </div>
      )}
      <GameMap snapshot={snapshot} />
      <GameHUD snapshot={snapshot} status={status} events={events} playerXp={playerXp} />
      <style>{`
        .game-shell { position: relative; height: 100vh; height: 100dvh; }
        .game-map { position: absolute; inset: 0; }
        .overlay { position: absolute; z-index: 5; top: 50%; left: 50%; transform: translate(-50%,-50%); padding: 1.25rem; text-align: center; }
      `}</style>
    </div>
  );
}
