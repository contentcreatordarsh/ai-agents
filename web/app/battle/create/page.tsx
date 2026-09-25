"use client";

import { useState } from "react";
import Link from "next/link";
import { api, setToken, getToken } from "@/lib/game/api";

export default function CreateBattlePage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Singapore City Battle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; code: string; joinUrl?: string } | null>(
    null,
  );

  async function ensureAuth() {
    if (getToken()) return;
    const data = await api<{ token: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    setToken(data.token);
  }

  async function onCreate() {
    setError(null);
    try {
      await ensureAuth();
      const data = await api<{
        game: { id: string; code: string; joinUrl?: string };
      }>("/api/v1/games", {
        method: "POST",
        body: JSON.stringify({
          name,
          mode: "CITY_BATTLE",
          center: { lat: 1.3521, lng: 103.8198 },
          radiusM: 5000,
          durationSeconds: 3600,
          teamCount: 4,
          maxPlayers: 32,
        }),
      });
      setResult(data.game);
      await api(`/api/v1/games/${data.game.id}/join`, {
        method: "POST",
        body: JSON.stringify({ team: "RED" }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="form-page">
      <Link href="/">← StrikeMap</Link>
      <h1>Create City Battle</h1>
      {!getToken() ? (
        <section className="glass">
          <h2>Sign up / sign in</h2>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
        </section>
      ) : null}
      <section className="glass">
        <label>
          Battle name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="button" className="btn primary" onClick={() => void onCreate()}>
          Create battle
        </button>
        {error ? <p className="err">{error}</p> : null}
        {result ? (
          <div className="success">
            <p>Code: <strong>{result.code}</strong></p>
            <p>
              <Link href={`/battle/play/?id=${result.id}`}>Enter lobby →</Link>
            </p>
            {result.joinUrl ? <p>Share: {result.joinUrl}</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
