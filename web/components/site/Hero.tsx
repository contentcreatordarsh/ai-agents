"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSiteUI } from "./SiteUIContext";
import { useWorldScene } from "@/components/world/WorldSceneContext";

const HeroTacticalVisual = dynamic(() => import("./HeroTacticalVisual"), { ssr: false });

export default function Hero() {
  const { open } = useSiteUI();
  const { setCursorMode, setCursorHint } = useWorldScene();
  const lines = ["REAL WORLD.", "REAL PLAYERS.", "ONE BATTLEFIELD."];

  return (
    <section id="hero" className="hero-section scene-panel hero-world">
      <div className="hero-inner">
        <div className="hero-copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            STRIKEMAP · LIVE MULTIPLAYER
          </motion.p>
          <h1 className="hero-massive">
            {lines.map((line, i) => (
              <motion.span
                key={line}
                className={i === 2 ? "outline" : ""}
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 * i, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            The map is the arena. Your city is the game. Capture sectors with your team in five-minute battles.
          </motion.p>
          <motion.div className="hero-ctas" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <button
              type="button"
              className="btn-cta"
              onMouseEnter={() => {
                setCursorMode("play");
                setCursorHint("ENTER →");
              }}
              onMouseLeave={() => {
                setCursorMode("default");
                setCursorHint("");
              }}
              onClick={() => open("deploy")}
            >
              ENTER BATTLE
            </button>
            <button type="button" className="btn-outline" onClick={() => open("demo")}>PLAY DEMO</button>
          </motion.div>
        </div>
        <motion.div
          className="hero-hud-wrap"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
        >
          <HeroTacticalVisual />
        </motion.div>
      </div>
    </section>
  );
}
