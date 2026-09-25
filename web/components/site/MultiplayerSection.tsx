"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function MultiplayerSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="multiplayer" className="section mp-section scene-panel" ref={ref}>
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        YOU ARE NOT <span className="outline">ALONE.</span>
      </motion.h2>
      <div className="mp-stage">
        <div className="mp-map">
          {["YOU", "PLAYER_02", "PLAYER_03"].map((p, i) => (
            <motion.span
              key={p}
              className={`mp-marker ${i === 0 ? "you" : ""}`}
              animate={{ x: [0, 12, -8, 0], y: [0, -6, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4 + i, ease: "easeInOut" }}
              style={{ left: `${20 + i * 28}%`, top: `${30 + (i % 2) * 20}%` }}
            >
              {p}
            </motion.span>
          ))}
        </div>
        <ul className="mp-status">
          <li><span>WEBSOCKET</span><strong>CONNECTED</strong></li>
          <li><span>GPS</span><strong>LOCKED</strong></li>
          <li><span>PLAYERS</span><strong>3</strong></li>
        </ul>
      </div>
    </section>
  );
}
