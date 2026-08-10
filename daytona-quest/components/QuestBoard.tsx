"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Mission, MissionRunResult, PlayerState } from "@/lib/types";
import { levelFromXp, xpToNextLevel } from "@/lib/player";

const STORAGE_KEY = "daytona-quest-player-v1";

function loadPlayer(): PlayerState {
  if (typeof window === "undefined") {
    return { totalXp: 0, level: 1, completedMissions: [], runs: [], sandboxesSpawned: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    return JSON.parse(raw) as PlayerState;
  } catch {
    return { totalXp: 0, level: 1, completedMissions: [], runs: [], sandboxesSpawned: 0 };
  }
}

function savePlayer(state: PlayerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const DIFFICULTY_STYLES = {
  easy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  hard: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export function QuestBoard({ initialMissions }: { initialMissions: Mission[] }) {
  const [missions] = useState(initialMissions);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setPlayer(loadPlayer());
  }, []);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev].slice(0, 12));
  }, []);

  const xpBar = useMemo(() => {
    if (!player) return { current: 0, needed: 200, pct: 0 };
    const { current, needed } = xpToNextLevel(player.totalXp);
    return { current, needed, pct: Math.min(100, (current / needed) * 100) };
  }, [player]);

  const isUnlocked = (mission: Mission): boolean => {
    if (mission.order === 1) return true;
    const prev = missions.find((m) => m.order === mission.order - 1);
    return prev ? player?.completedMissions.includes(prev.id) ?? false : true;
  };

  const runMission = async (mission: Mission) => {
    if (!player || activeId) return;
    if (!isUnlocked(mission)) return;

    setActiveId(mission.id);
    pushLog(`Deploying sandbox for «${mission.title}»…`);

    try {
      const res = await fetch(`/api/missions/${mission.id}/run`, { method: "POST" });
      const result = (await res.json()) as MissionRunResult;

      if (result.success) {
        const next: PlayerState = {
          totalXp: player.totalXp + result.xpEarned,
          level: levelFromXp(player.totalXp + result.xpEarned),
          completedMissions: player.completedMissions.includes(mission.id)
            ? player.completedMissions
            : [...player.completedMissions, mission.id],
          runs: [result, ...player.runs].slice(0, 20),
          sandboxesSpawned: player.sandboxesSpawned + 1,
        };
        setPlayer(next);
        savePlayer(next);
        pushLog(`✓ ${mission.title} +${result.xpEarned} XP (${result.durationMs}ms)`);
        if (result.output) pushLog(`  → ${result.output.slice(0, 80)}`);
      } else {
        pushLog(`✗ ${mission.title} failed: ${result.error ?? "unknown"}`);
      }
    } catch (e) {
      pushLog(`✗ Network error: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setActiveId(null);
    }
  };

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-cyan-300">
        Loading quest data…
      </div>
    );
  }

  const completedCount = player.completedMissions.length;
  const totalMissions = missions.length;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
                Daytona Sandbox Quest
              </p>
              <h1 className="mt-1 bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
                Gamified Ops Visualizer
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Missions inspired by{" "}
                <a
                  href="https://www.daytona.io/docs/en/"
                  className="text-cyan-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  daytona.io/docs
                </a>
                . Each quest spins a real Daytona sandbox, runs live ops, and awards XP.
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 text-center">
              <p className="text-xs uppercase tracking-wider text-violet-300">Level</p>
              <p className="text-4xl font-black text-white">{player.level}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1 flex justify-between font-mono text-xs text-slate-400">
              <span>{player.totalXp} XP total</span>
              <span>
                {xpBar.current} / {xpBar.needed} to next level
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700"
                style={{ width: `${xpBar.pct}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-center text-xs md:text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 py-2">
              <p className="text-slate-500">Missions</p>
              <p className="text-lg font-bold text-cyan-300">
                {completedCount}/{totalMissions}
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 py-2">
              <p className="text-slate-500">Sandboxes</p>
              <p className="text-lg font-bold text-emerald-300">{player.sandboxesSpawned}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 py-2">
              <p className="text-slate-500">Mode</p>
              <p className="text-lg font-bold text-violet-300">Live Sandbox</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-cyan-400">
              Mission Map
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {missions.map((mission) => {
                const unlocked = isUnlocked(mission);
                const done = player.completedMissions.includes(mission.id);
                const running = activeId === mission.id;

                return (
                  <article
                    key={mission.id}
                    className={`relative overflow-hidden rounded-xl border p-4 transition ${
                      done
                        ? "border-emerald-500/50 bg-emerald-950/20"
                        : unlocked
                          ? "border-slate-600 bg-slate-900/70 hover:border-cyan-500/40"
                          : "border-slate-800 bg-slate-950/50 opacity-50"
                    }`}
                  >
                    {!unlocked && (
                      <div className="absolute right-3 top-3 text-2xl opacity-60">🔒</div>
                    )}
                    {done && (
                      <div className="absolute right-3 top-3 text-emerald-400">✓</div>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{mission.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">{mission.title}</h3>
                          <span
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${DIFFICULTY_STYLES[mission.difficulty]}`}
                          >
                            {mission.difficulty}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{mission.subtitle}</p>
                        <p className="mt-2 font-mono text-[10px] text-slate-500">
                          Docs: {mission.docRef.section}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-sm text-amber-300">+{mission.xp} XP</span>
                          <button
                            type="button"
                            disabled={!unlocked || running || !!activeId}
                            onClick={() => void runMission(mission)}
                            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {running ? "Running…" : done ? "Replay" : "Launch"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <h2 className="font-mono text-sm uppercase tracking-widest text-violet-400">
                Live Feed
              </h2>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto font-mono text-xs text-slate-300">
                {log.length === 0 && (
                  <li className="text-slate-500">Launch a mission to see sandbox events…</li>
                )}
                {log.map((line, i) => (
                  <li key={i} className="border-l-2 border-cyan-500/30 pl-2">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <h2 className="font-mono text-sm uppercase tracking-widest text-emerald-400">
                Recent Runs
              </h2>
              <ul className="mt-3 space-y-2">
                {player.runs.length === 0 && (
                  <li className="text-sm text-slate-500">No runs yet.</li>
                )}
                {player.runs.slice(0, 5).map((run) => (
                  <li
                    key={`${run.missionId}-${run.completedAt}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-xs"
                  >
                    <p className="font-bold text-white">{run.title}</p>
                    <p className={run.success ? "text-emerald-400" : "text-rose-400"}>
                      {run.success ? `+${run.xpEarned} XP` : run.error} · {run.durationMs}ms
                    </p>
                    {run.sandboxId && (
                      <p className="mt-1 truncate font-mono text-slate-500">{run.sandboxId}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
