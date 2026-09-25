import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function LeaderboardPage() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    void api<{ entries: Record<string, unknown>[] }>("/api/leaderboard/global").then((d) =>
      setEntries(d.entries),
    );
  }, []);
  return (
    <div className="pad">
      <h1 className="brand-font">Global Leaderboard</h1>
      <ol>
        {entries.map((e, i) => (
          <li key={i}>
            {(e as { username: string }).username} — {(e as { total_xp: number }).total_xp ?? 0} XP
          </li>
        ))}
      </ol>
      {!entries.length && <p className="muted">No rankings yet — play a battle!</p>}
      <style>{`.pad { padding: 1.25rem; } .muted { color: var(--muted); }`}</style>
    </div>
  );
}
