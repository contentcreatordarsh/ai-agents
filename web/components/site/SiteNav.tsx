"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSiteUI } from "./SiteUIContext";

const LINKS = [
  { id: "battles", label: "BATTLES" },
  { id: "systems", label: "GAME" },
  { id: "world", label: "HOW IT WORKS" },
  { id: "leaderboard", label: "LEADERBOARD" },
  { id: "contact", label: "CONTACT" },
];

export default function SiteNav() {
  const { open, scrollTo } = useSiteUI();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`site-nav ${scrolled ? "scrolled" : ""}`}>
        <button type="button" className="nav-logo" onClick={() => scrollTo("hero")}>
          STRIKEMAP
        </button>
        <nav className="nav-center" aria-label="Primary">
          {LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollTo(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="nav-right">
          <button type="button" className="nav-ghost" onClick={() => open("login")}>
            LOGIN
          </button>
          <button type="button" className="btn-cta nav-play" onClick={() => open("deploy")}>
            PLAY NOW
          </button>
          <button
            type="button"
            className="nav-burger"
            aria-label="Open menu"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <AnimatePresence>
        {mobile ? (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button type="button" className="mobile-close" onClick={() => setMobile(false)} aria-label="Close menu">
              ×
            </button>
            {LINKS.map((l, i) => (
              <motion.button
                key={l.id}
                type="button"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => {
                  setMobile(false);
                  scrollTo(l.id);
                }}
              >
                {l.label}
              </motion.button>
            ))}
            <button type="button" onClick={() => { setMobile(false); open("login"); }}>LOGIN</button>
            <button type="button" className="btn-cta" onClick={() => { setMobile(false); open("deploy"); }}>
              PLAY NOW
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
