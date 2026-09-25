"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type BootLine = { label: string; ok: boolean };

const BOOT_CHECKS: BootLine[] = [
  { label: "GEOSPATIAL SYSTEM", ok: true },
  { label: "PLAYER NETWORK", ok: true },
  { label: "TERRITORY ENGINE", ok: true },
  { label: "MATCH SYSTEM", ok: true },
];

type Props = {
  onComplete: () => void;
};

export default function IntroLoader({ onComplete }: Props) {
  const [phase, setPhase] = useState<"signal" | "boot" | "ready">("signal");
  const [lines, setLines] = useState<BootLine[]>([]);
  const [exiting, setExiting] = useState(false);
  const runId = useRef(0);

  const startBoot = () => {
    setLines([]);
    setPhase("boot");
  };

  useEffect(() => {
    if (phase !== "boot") return;

    const id = ++runId.current;
    const checks: BootLine[] = BOOT_CHECKS.map((row) => {
      if (row.label === "GEOSPATIAL SYSTEM") {
        return { ...row, ok: typeof navigator !== "undefined" && "geolocation" in navigator };
      }
      if (row.label === "PLAYER NETWORK") {
        return { ...row, ok: typeof navigator !== "undefined" && navigator.onLine };
      }
      return row;
    });

    let cancelled = false;

    (async () => {
      for (const check of checks) {
        if (cancelled || runId.current !== id) return;
        setLines((prev) => [...prev, check]);
        await new Promise((r) => setTimeout(r, 480));
      }
      if (cancelled || runId.current !== id) return;
      try {
        await fetch("/api/v1/health", { method: "GET" });
      } catch {
        /* edge may be offline — still allow entry */
      }
      if (!cancelled && runId.current === id) setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  const enter = () => {
    setExiting(true);
    setTimeout(onComplete, 900);
  };

  const safeLines = lines.filter((l): l is BootLine => Boolean(l?.label));

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
              onClick={startBoot}
            >
              ENTER THE BATTLEFIELD
            </motion.button>
          ) : null}

          {phase !== "signal" ? (
            <div className="intro-boot" aria-live="polite">
              <p className="intro-boot-title">INITIALIZING BATTLEFIELD</p>
              <ul>
                {safeLines.map((l) => (
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
