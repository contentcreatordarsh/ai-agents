"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DEMO_BATTLES } from "@/lib/demo-battles";
import { useSiteUI } from "./SiteUIContext";
import { useWorldScene } from "@/components/world/WorldSceneContext";

export default function BattlesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { open } = useSiteUI();
  const { focusBattle, setHoveredBattleId, setCursorMode, setCursorHint } = useWorldScene();

  return (
    <section id="battles" className="section battles-section scene-panel" ref={ref}>
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        LIVE BATTLEFIELD
      </motion.h2>
      <div className="battle-feed">
        {DEMO_BATTLES.map((b, i) => (
          <motion.button
            type="button"
            key={b.id}
            className="battle-feed-row"
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            onMouseEnter={() => {
              focusBattle(b.lng, b.lat);
              setHoveredBattleId(b.id);
              setCursorMode("join");
              setCursorHint(`${b.city}\n${b.status}`);
            }}
            onMouseLeave={() => {
              setHoveredBattleId(null);
              setCursorMode("default");
              setCursorHint("");
            }}
            onFocus={() => focusBattle(b.lng, b.lat)}
            onClick={() => open("battle-preview", b.id)}
          >
            <span className="battle-dot" aria-hidden />
            <span className="battle-city">{b.city}</span>
            <span className="battle-code">BATTLE {b.battleCode}</span>
            <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
            <span className="battle-meta">
              RED {b.status === "LOBBY" ? "—" : b.red} · BLUE {b.status === "LOBBY" ? "—" : b.blue}
            </span>
            <span className="battle-players">{b.players} OPERATORS</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
