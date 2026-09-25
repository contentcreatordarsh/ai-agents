"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiteUIProvider } from "./SiteUIContext";
import IntroLoader from "./IntroLoader";
import SiteNav from "./SiteNav";
import Hero from "./Hero";
import WorldSection from "./WorldSection";
import BattlesSection from "./BattlesSection";
import SystemsSection from "./SystemsSection";
import TerritorySection from "./TerritorySection";
import MultiplayerSection from "./MultiplayerSection";
import KineticScrollSection from "./KineticScrollSection";
import MissionSection from "./MissionSection";
import LeaderboardSection from "./LeaderboardSection";
import ContactSection from "./ContactSection";
import SiteFooter from "./SiteFooter";
import SiteModals from "./SiteModals";
import ExperienceShell from "@/components/world/ExperienceShell";

const INTRO_KEY = "strikemap_intro_seen_v3";

export default function ImmersiveSite() {
  const [booted, setBooted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(INTRO_KEY);
    if (!seen) setShowIntro(true);
    else setEntered(true);
    setBooted(true);
  }, []);

  const finishIntro = () => {
    localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
    setEntered(true);
  };

  if (!booted) {
    return (
      <div className="site-loading" aria-busy="true">
        STRIKEMAP
      </div>
    );
  }

  return (
    <SiteUIProvider>
      {showIntro ? <IntroLoader onComplete={finishIntro} /> : null}
      {entered ? (
        <ExperienceShell>
          <motion.div
            className="site-root experience-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <SiteNav />
            <main>
              <Hero />
              <WorldSection />
              <BattlesSection />
              <SystemsSection />
              <TerritorySection />
              <MultiplayerSection />
              <KineticScrollSection />
              <MissionSection />
              <LeaderboardSection />
              <ContactSection />
            </main>
            <SiteFooter />
          </motion.div>
        </ExperienceShell>
      ) : null}
      {entered ? <SiteModals /> : null}
    </SiteUIProvider>
  );
}
