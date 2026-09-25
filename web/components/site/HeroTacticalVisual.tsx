"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HeroTacticalVisual() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const capture = 64 + (tick % 3) * 2;

  return (
    <div className="hero-visual" aria-hidden>
      <div className="hero-visual-frame">
        <div className="radar-sweep" />
        <svg viewBox="0 0 400 400" className="tactical-svg">
          <defs>
            <linearGradient id="gridGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#168CFF" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="url(#gridGlow)" strokeWidth="0.5" />
          ))}
          {[...Array(8)].map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="url(#gridGlow)" strokeWidth="0.5" />
          ))}
          <polygon
            points="200,140 260,200 200,260 140,200"
            fill="rgba(0,245,212,0.08)"
            stroke="#00F5D4"
            strokeWidth="2"
            className="sector-poly"
          />
          <motion.circle
            cx="200"
            cy="200"
            r="6"
            fill="#FF315D"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <motion.circle
            cx="280"
            cy="240"
            r="6"
            fill="#168CFF"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.4 }}
          />
          <line x1="200" y1="200" x2="280" y2="240" stroke="#00F5D4" strokeOpacity="0.4" strokeDasharray="4 4" />
        </svg>
        <div className="hud-panel top">
          <span>SINGAPORE SECTOR</span>
          <span className="live-pill">LIVE</span>
        </div>
        <div className="hud-panel bottom">
          <div>18 PLAYERS ONLINE</div>
          <div className="sector-label">SECTOR 01</div>
          <div className="capture-bar">
            <span style={{ width: `${Math.min(100, capture)}%` }} />
          </div>
          <div>CAPTURE {capture}%</div>
          <div className="scores-row">
            <span className="red">RED 500</span>
            <span className="blue">BLUE 750</span>
          </div>
        </div>
      </div>
    </div>
  );
}
