"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type BootLine = { label: string; ok: boolean };

type Props = {
  onComplete: () => void;
};

export default function IntroLoader({ onComplete }: Props) {
  const [phase, setPhase] = useState<"signal" | "boot" | "ready">("signal");
  const [lines, setLines] = useState<BootLine[]>([]);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (phase !== "boot") return;

    const checks: BootLine[] = [
      { label: "GEOSPATIAL SYSTEM", ok: typeof window !== "undefined" && "geolocation" in navigator },
      { label: "PLAYER NETWORK", ok: typeof navigator !== "undefined" && navigator.onLine },
      { label: "TERRITORY ENGINE", ok: true },
      { label: "MATCH SYSTEM", ok: true },
    ];

    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = () => {
      if (i < checks.length) {
        setLines((prev) => [...prev, checks[i]]);
        i += 1;
        timers.push(setTimeout(tick, 520));
      } else {
        void fetch("/api/v1/health", { method: "GET" })
          .then((r) => r.ok)
          .catch(() => false)
          .finally(() => {
            timers.push(setTimeout(() => setPhase("ready"), 400));
          });
      }
    };
    timers.push(setTimeout(tick, 300));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const enter = () => {
    setExiting(true);
    setTimeout(onComplete, 900);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          className="intro-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="StrikeMap entry"
        >
          <div className="intro-grid" aria-hidden />
          <motion.p
            className="intro-brand"
            style={{ position: "relative", zIndex: 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            STRIKEMAP
          </motion.p>
          <div className="intro-tags">
            {["REAL WORLD", "MULTIPLAYER", "TERRITORY BATTLE"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {phase === "signal" ? (
            <motion.button
              type="button"
              className="btn-cta intro-enter"
              onClick={() => setPhase("boot")}
            >
              ENTER THE BATTLEFIELD
            </motion.button>
          ) : null}

          {phase !== "signal" ? (
            <div className="intro-boot" aria-live="polite">
              <p className="intro-boot-title">INITIALIZING BATTLEFIELD</p>
              <ul>
                {lines.map((l) => (
                  <li key={l.label}>
                    <span>{l.label}</span>
                    <span className={l.ok ? "online" : "offline"}>{l.ok ? "ONLINE" : "OFFLINE"}</span>
                  </li>
                ))}
              </ul>
              {phase === "ready" ? (
                <>
                  <p className="intro-online">STRIKEMAP ONLINE</p>
                  <button type="button" className="btn-cta intro-enter" onClick={enter}>
                    ENTER STRIKEMAP
                  </button>
                </>
              ) : (
                <button type="button" className="btn-cta intro-enter ghost" disabled>LOADING…</button>
              )}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
