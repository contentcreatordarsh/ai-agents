"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSiteUI } from "./SiteUIContext";

const HeroTacticalVisual = dynamic(() => import("./HeroTacticalVisual"), { ssr: false });

export default function Hero() {
  const { open } = useSiteUI();
  const lines = ["TURN YOUR CITY", "INTO A", "BATTLEFIELD"];

  return (
    <section id="hero" className="hero-section">
      <div className="hero-inner">
        <div className="hero-copy">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            LIVE · MULTIPLAYER · REAL WORLD
          </motion.p>
          <h1>
            {lines.map((line, i) => (
              <motion.span
                key={line}
                className={i === 1 ? "outline" : ""}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            StrikeMap turns real-world locations into live multiplayer battles. Capture sectors. Move with your team.
            Control the map.
          </motion.p>
          <motion.div className="hero-ctas" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <button type="button" className="btn-cta" onClick={() => open("deploy")}>PLAY NOW</button>
            <button type="button" className="btn-outline" onClick={() => open("create")}>CREATE BATTLE</button>
            <button type="button" className="btn-outline" onClick={() => open("demo")}>WATCH DEMO</button>
          </motion.div>
        </div>
        <motion.div
          className="hero-visual-wrap"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.9 }}
        >
          <HeroTacticalVisual />
        </motion.div>
      </div>
    </section>
  );
}
