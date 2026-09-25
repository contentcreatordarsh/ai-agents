"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const SYSTEMS = [
  { n: "01", title: "LIVE MAP", body: "Your city becomes the arena." },
  { n: "02", title: "TERRITORY", body: "Capture and control sectors." },
  { n: "03", title: "MULTIPLAYER", body: "See other players in real time." },
  { n: "04", title: "FIVE MINUTES", body: "Short, intense battles." },
];

export default function SystemsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="systems" className="section systems-section scene-panel" ref={ref}>
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        BUILT FOR
        <br />
        <span className="outline">THE STREET.</span>
      </motion.h2>
      <div className="systems-grid">
        {SYSTEMS.map((s, i) => (
          <motion.article
            key={s.n}
            className="system-row"
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            whileHover={{ x: 8 }}
          >
            <span className="num">{s.n}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
