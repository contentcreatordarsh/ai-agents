"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/game/api";

function JoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  }, [params]);

  async function ensureAuth() {
    if (getToken()) return;
    const data = await api<{ token: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    setToken(data.token);
  }

  async function onJoin() {
    setError(null);
    try {
      await ensureAuth();
      const lookup = await api<{ game: { id: string } }>(`/api/v1/games/join/${code}`);
      const gameId = lookup.game.id;
      const joined = await api<{ message?: string }>(`/api/v1/games/${gameId}/join`, {
        method: "POST",
        body: "{}",
      });
      if (joined.message) alert(joined.message);
      router.push(`/battle/play/?id=${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join failed");
    }
  }

  return (
    <div className="form-page">
      <Link href="/">← StrikeMap</Link>
      <h1>Join battle</h1>
      <section className="glass">
        <label>
          Join code
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        {!getToken() ? (
          <>
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
          </>
        ) : null}
        <button type="button" className="btn primary" onClick={() => void onJoin()}>
          Join
        </button>
        {error ? <p className="err">{error}</p> : null}
      </section>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<p style={{ padding: "2rem" }}>Loading…</p>}>
      <JoinInner />
    </Suspense>
  );
}
