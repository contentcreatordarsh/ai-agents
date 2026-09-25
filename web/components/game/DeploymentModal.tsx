"use client";

import { useSiteUI } from "@/components/site/SiteUIContext";

export default function DeploymentModal() {
  const { open, close } = useSiteUI();
  return (
    <div className="deploy-grid">
      <button type="button" className="deploy-card" onClick={() => { close(); open("create"); }}>
        <span className="deploy-icon">▶</span>
        <strong>START BATTLE</strong>
        <span>Create a new City Battle</span>
      </button>
      <button type="button" className="deploy-card" onClick={() => { close(); open("join"); }}>
        <span className="deploy-icon">◎</span>
        <strong>JOIN BATTLE</strong>
        <span>Enter battle code</span>
      </button>
      <button type="button" className="deploy-card accent" onClick={() => { close(); open("demo"); }}>
        <span className="deploy-icon">◉</span>
        <strong>WATCH DEMO</strong>
        <span>Simulated live battle</span>
      </button>
    </div>
  );
}
