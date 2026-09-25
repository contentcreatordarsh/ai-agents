import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { TEAM_COLORS, type TeamId } from "../types/game";

export function JoinPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const [game, setGame] = useState<{ id: string; locationName: string } | null>(null);
  const [team, setTeam] = useState<TeamId>("blue");

  useEffect(() => {
    if (!code) return;
    void api<{ game: { id: string; locationName: string } }>(`/api/games/join/${code}`).then((d) =>
      setGame(d.game),
    );
  }, [code]);

  const join = async () => {
    if (!game) return;
    await api(`/api/games/${game.id}/join`, {
      method: "POST",
      body: JSON.stringify({ team, joinCode: code?.toUpperCase() }),
    });
    nav(`/game/${game.id}?team=${team}`);
  };

  if (!game) return <p className="pad">Loading battle…</p>;

  return (
    <div className="pad">
      <h1 className="brand-font">JOIN {code}</h1>
      <p>{game.locationName}</p>
      <div className="teams">
        {(Object.keys(TEAM_COLORS) as TeamId[]).map((t) => (
          <button
            key={t}
            type="button"
            className={team === t ? "active" : ""}
            style={{ borderColor: TEAM_COLORS[t] }}
            onClick={() => setTeam(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={join}>Enter lobby</button>
      <p><Link to="/login">Login</Link> required</p>
      <style>{`
        .pad { padding: 1.25rem; max-width: 480px; margin: 0 auto; }
        .teams { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1rem 0; }
        .teams button { padding: 0.75rem; background: transparent; border: 2px solid; color: var(--text); border-radius: 8px; cursor: pointer; }
        .teams .active { background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
}
