import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function CreateBattlePage() {
  const nav = useNavigate();
  const [locationName, setLocationName] = useState("Singapore");
  const [radiusKm, setRadiusKm] = useState(5);
  const [durationMin, setDurationMin] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(32);
  const [err, setErr] = useState("");

  const create = async () => {
    setErr("");
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }),
      ).catch(() => ({ coords: { latitude: 1.3521, longitude: 103.8198 } } as GeolocationPosition));
      const data = await api<{ game: { id: string; code: string } }>("/api/v1/games", {
        method: "POST",
        body: JSON.stringify({
          name: locationName,
          mode: "CITY_BATTLE",
          center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          radiusM: radiusKm * 1000,
          durationSeconds: durationMin * 60,
          teamCount: 4,
          maxPlayers,
        }),
      });
      nav(`/game/${data.game.id}?host=1&code=${data.game.code}`);
    } catch {
      setErr("Create failed — login required?");
    }
  };

  return (
    <div className="pad">
      <h1 className="brand-font">+ CREATE BATTLE</h1>
      <div className="glass form">
        <label>Location<input value={locationName} onChange={(e) => setLocationName(e.target.value)} /></label>
        <label>Radius (km)<input type="number" value={radiusKm} onChange={(e) => setRadiusKm(+e.target.value)} /></label>
        <label>Duration (min)<input type="number" value={durationMin} onChange={(e) => setDurationMin(+e.target.value)} /></label>
        <label>Max players<input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(+e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn-primary" onClick={create}>Generate battle</button>
      </div>
      <style>{`
        .pad { padding: 1.25rem; max-width: 520px; margin: 0 auto; }
        .form { padding: 1rem; display: grid; gap: 0.75rem; margin-top: 1rem; }
        label { display: grid; gap: 0.35rem; }
        input { padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border); background: #0c1018; color: var(--text); }
        .err { color: #ff6b8a; }
      `}</style>
    </div>
  );
}
