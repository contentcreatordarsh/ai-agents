"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function WorldSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="world" className="section world-section scene-panel" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <p className="section-eyebrow">THE WORLD</p>
        <h2 className="section-title">
          THE CITY IS
          <br />
          <span className="outline">THE GAME.</span>
        </h2>
        <p className="section-body">
          StrikeMap turns real-world locations into multiplayer territory. You are not playing inside an isolated fictional
          map — the city itself becomes the battlefield.
        </p>
        <ul className="world-lines">
          <li>YOUR CITY.</li>
          <li>YOUR TEAM.</li>
          <li>YOUR TERRITORY.</li>
        </ul>
      </motion.div>
      <div className="world-map-art" aria-hidden>
        <div className="world-grid" />
        <div className="world-ring" />
      </div>
    </section>
  );
}
