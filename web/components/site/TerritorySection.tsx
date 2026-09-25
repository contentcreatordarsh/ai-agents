"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function TerritorySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [progress, setProgress] = useState(0);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 5;
      });
    }, 400);
    return () => clearInterval(id);
  }, [inView]);

  useEffect(() => {
    if (progress >= 100) setCaptured(true);
  }, [progress]);

  return (
    <section id="territory" className="section territory-section scene-panel" ref={ref}>
      <h2 className="section-title">TAKE THE <span className="outline">SECTOR.</span></h2>
      <div className="territory-stage">
        <motion.div
          className="territory-hex"
          animate={{ boxShadow: captured ? "0 0 60px rgba(22,140,255,0.5)" : "0 0 30px rgba(0,245,212,0.3)" }}
        >
          <span>SECTOR 01</span>
          <div className="team-tags">
            <span className="red">RED</span>
            <span className="blue">BLUE</span>
          </div>
          <div className="cap-ring" style={{ "--p": `${progress}%` } as React.CSSProperties}>
            <strong>{progress}%</strong>
          </div>
          {captured ? (
            <motion.p className="capture-flash" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              SECTOR CAPTURED · BLUE +250
            </motion.p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
