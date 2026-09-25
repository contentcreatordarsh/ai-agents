"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/game/api";
import { useSiteUI } from "@/components/site/SiteUIContext";

export default function JoinBattleFlow() {
  const router = useRouter();
  const { playerName, close } = useSiteUI();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function ensureAuth() {
    if (getToken()) return;
    const user = (playerName || "guest").toLowerCase().replace(/\s+/g, "");
    const data = await api<{ token: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `${user}@join.strikemap`,
        username: user.slice(0, 20),
        password: "battlepass123",
      }),
    });
    setToken(data.token);
  }

  async function onJoin() {
    setError(null);
    try {
      await ensureAuth();
      const lookup = await api<{ game: { id: string } }>(`/api/v1/games/join/${code.toUpperCase()}`);
      const joined = await api<{ message?: string }>(`/api/v1/games/${lookup.game.id}/join`, {
        method: "POST",
        body: "{}",
      });
      if (joined.message) {
        // eslint-disable-next-line no-alert
        alert(joined.message);
      }
      close();
      router.push(`/battle/play/?id=${lookup.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join failed");
    }
  }

  return (
    <div className="join-form">
      <label>
        ENTER BATTLE CODE
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="X7K9Q"
          maxLength={8}
          autoComplete="off"
        />
      </label>
      <button type="button" className="btn-cta full" onClick={() => void onJoin()}>JOIN BATTLE</button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
