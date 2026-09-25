"use client";

import { useSiteUI } from "./SiteUIContext";

export default function MissionSection() {
  const { open } = useSiteUI();
  return (
    <section id="mission" className="section mission-section">
      <h2 className="section-title">DEPLOY IN <span className="outline">60 SECONDS.</span></h2>
      <p className="section-body">Create a battle, share a code, capture sector 01. Cloudflare edge + Durable Objects keep every move in sync.</p>
      <button type="button" className="btn-cta large" onClick={() => open("deploy")}>PLAY NOW</button>
    </section>
  );
}
