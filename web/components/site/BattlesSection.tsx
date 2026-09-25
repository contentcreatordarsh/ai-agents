"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DEMO_BATTLES } from "@/lib/demo-battles";
import { useSiteUI } from "./SiteUIContext";

export default function BattlesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { open } = useSiteUI();

  return (
    <section id="battles" className="section battles-section" ref={ref}>
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        LIVE BATTLES
      </motion.h2>
      <div className="battle-cards">
        {DEMO_BATTLES.map((b, i) => (
          <motion.button
            type="button"
            key={b.id}
            className="battle-card"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            onClick={() => open("battle-preview", b.id)}
          >
            <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
            <span className="city">{b.city}</span>
            <span className="players">{b.players} PLAYERS</span>
            {b.status === "LIVE" ? (
              <span className="meta">CAPTURE {b.capture}% · R{b.red} / B{b.blue}</span>
            ) : (
              <span className="meta">WAITING FOR OPERATORS</span>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
