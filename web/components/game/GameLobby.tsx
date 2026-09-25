"use client";

import type { TeamColor } from "@/lib/game/contracts";
import { TEAM_COLORS } from "@/lib/game/contracts";

type Player = { id: string; username: string; team: TeamColor; status: string };

type Props = {
  name: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
  onStart: () => void;
};

export default function GameLobby({ name, code, players, maxPlayers, isHost, onStart }: Props) {
  const red = players.filter((p) => p.team === "RED");
  const blue = players.filter((p) => p.team === "BLUE");

  return (
    <div className="lobby-overlay glass">
      <h2>CITY BATTLE</h2>
      <p className="battle-name">{name}</p>
      <p className="code">CODE: {code}</p>
      <div className="teams">
        <div>
          <h3 style={{ color: TEAM_COLORS.RED }}>RED</h3>
          {red.map((p) => <div key={p.id}>🔴 {p.username}</div>)}
          {!red.length ? <div className="muted">—</div> : null}
        </div>
        <div>
          <h3 style={{ color: TEAM_COLORS.BLUE }}>BLUE</h3>
          {blue.map((p) => <div key={p.id}>🔵 {p.username}</div>)}
          {!blue.length ? <div className="muted">—</div> : null}
        </div>
      </div>
      <p className="count">{players.length} / {maxPlayers} PLAYERS</p>
      {isHost ? (
        <button type="button" className="btn primary" onClick={onStart}>
          START BATTLE
        </button>
      ) : (
        <p className="muted">Waiting for host to start…</p>
      )}
      <style jsx>{`
        .lobby-overlay {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem;
          text-align: center;
        }
        .battle-name {
          color: var(--muted);
          margin: 0;
        }
        .code {
          font-size: 1.4rem;
          letter-spacing: 0.25em;
          color: var(--neon-cyan);
        }
        .teams {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          text-align: left;
          width: min(100%, 360px);
        }
        .count {
          font-weight: 700;
        }
        .muted {
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
