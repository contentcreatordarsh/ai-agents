"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/game/api";
import { useSiteUI } from "@/components/site/SiteUIContext";

export default function CreateBattleFlow() {
  const router = useRouter();
  const { playerName, close } = useSiteUI();
  const [name, setName] = useState("Singapore Night Raid");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"form" | "created">("form");
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function ensureAuth() {
    if (getToken()) return;
    const user = (playerName || "operator").toLowerCase().replace(/\s+/g, "");
    const mail = email || `${user}@players.strikemap`;
    const data = await api<{ token: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: mail,
        username: user.slice(0, 20),
        password: password || "battlepass123",
      }),
    });
    setToken(data.token);
  }

  async function onCreate() {
    setError(null);
    try {
      await ensureAuth();
      const data = await api<{ game: { id: string; code: string } }>("/api/v1/games", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setCode(data.game.code);
      setGameId(data.game.id);
      setPhase("created");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  if (phase === "created") {
    return (
      <div className="create-success">
        <p className="success-title">BATTLE CREATED</p>
        <p className="code-display">{code}</p>
        <div className="row-btns">
          <button type="button" className="btn-outline" onClick={() => navigator.clipboard.writeText(code)}>
            COPY CODE
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigator.clipboard.writeText(`https://strikemap.space/join/?code=${code}`)}
          >
            SHARE BATTLE
          </button>
        </div>
        <button
          type="button"
          className="btn-cta full"
          onClick={() => {
            close();
            router.push(`/battle/play/?id=${gameId}`);
          }}
        >
          ENTER LOBBY →
        </button>
      </div>
    );
  }

  return (
    <div className="create-form">
      <label>
        BATTLE NAME
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {!getToken() ? (
        <>
          <label>EMAIL (auth) <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>PASSWORD <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars" /></label>
        </>
      ) : null}
      <ul className="settings-list">
        <li>PLAYERS · 2–8</li>
        <li>TEAMS · RED / BLUE</li>
        <li>DURATION · 05:00</li>
        <li>SECTORS · 01</li>
      </ul>
      <button type="button" className="btn-cta full" onClick={() => void onCreate()}>CREATE BATTLE →</button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
