"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken, getToken } from "@/lib/game/api";

export default function CreateBattlePage() {
  const router = useRouter();
  const [name, setName] = useState("Singapore Battle");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        game: { id: string; code: string };
      }>("/api/v1/games", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      router.push(`/battle/play/?id=${data.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="form-page">
      <Link href="/">← StrikeMap</Link>
      <h1>CITY BATTLE</h1>
      <p>Battle name</p>
      {!getToken() ? (
        <section className="glass">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password (8+ chars)
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
        </section>
      ) : null}
      <section className="glass">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Battle name" />
        <button type="button" className="btn primary" onClick={() => void onCreate()}>
          CREATE BATTLE
        </button>
        {error ? <p className="err">{error}</p> : null}
      </section>
    </div>
  );
}
