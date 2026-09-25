"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  "INITIALIZING BATTLEFIELD",
  "LOADING CITY DATA",
  "CONNECTING TO EDGE",
  "READY",
];

type Props = {
  onComplete: () => void;
};

export default function IntroLoader({ onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!started) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), 400 + i * 650));
    });
    timers.push(setTimeout(() => setReady(true), 400 + STEPS.length * 650));
    return () => timers.forEach(clearTimeout);
  }, [started]);

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
            transition={{ duration: 0.8 }}
          >
            STRIKEMAP
          </motion.p>
          <div className="intro-tags">
            {["REAL WORLD", "LIVE MULTIPLAYER", "CITY BATTLE"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
              >
                {t}
              </motion.span>
            ))}
          </div>
          <div className="intro-status" aria-live="polite">
            {started ? <span className="intro-pulse" /> : null}
            {started ? STEPS[step] : "AWAITING DEPLOYMENT"}
          </div>
          {!started ? (
            <motion.button
              type="button"
              className="btn-cta intro-enter"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setStarted(true)}
            >
              ENTER THE GAME
            </motion.button>
          ) : ready ? (
            <motion.button
              type="button"
              className="btn-cta intro-enter"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={enter}
            >
              ENTER STRIKEMAP
            </motion.button>
          ) : (
            <motion.button type="button" className="btn-cta intro-enter ghost" disabled>
              LOADING…
            </motion.button>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
