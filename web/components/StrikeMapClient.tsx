"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_EVENTS, type StrikeEvent } from "@/lib/demo-events";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import MapView from "@/components/MapView";

const severityColor: Record<StrikeEvent["severity"], string> = {
  high: "#e05252",
  medium: "#d4a020",
  low: "#4aba7a",
};

function StaticMapFallback() {
  return (
    <div className="map-fallback-panel">
      <p>
        Interactive WebGL map is unavailable in this environment. Showing a static regional
        overview; the event feed remains fully usable.
      </p>
      <iframe
        title="Regional map"
        src="https://www.openstreetmap.org/export/embed.html?bbox=34.0%2C29.0%2C36.5%2C33.5&layer=mapnik"
        loading="lazy"
      />
      <style jsx>{`
        .map-fallback-panel {
          height: 100%;
          min-height: 480px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #12100e;
        }
        .map-fallback-panel p {
          margin: 0;
          color: var(--ink-muted);
          font-size: 0.85rem;
        }
        iframe {
          flex: 1;
          border: 1px solid var(--paper-border);
          border-radius: 8px;
          min-height: 400px;
        }
      `}</style>
    </div>
  );
}

export default function StrikeMapClient() {
  const [selected, setSelected] = useState<StrikeEvent | null>(DEMO_EVENTS[0]);
  const [geo, setGeo] = useState<string>("Loading edge geo…");
  const [useStaticMap, setUseStaticMap] = useState(false);

  const onSelect = useCallback((evt: StrikeEvent) => {
    setSelected(evt);
  }, []);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d) => {
        if (d.country) {
          setGeo(
            `Edge: ${d.country}${d.colo ? ` · ${d.colo}` : ""} (${d.source ?? "worker"})`,
          );
        } else {
          setGeo(`Origin / edge: ${d.source ?? "unknown"}`);
        }
      })
      .catch(() => setGeo("Geo via Cloudflare edge when proxied"));
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo">SM</span>
          <div>
            <h1>STRIKEMAP</h1>
            <p className="muted">Live intelligence map · demo scaffold</p>
          </div>
        </div>
        <p className="muted geo">{geo}</p>
      </header>
      <div className="main">
        <div className="map">
          {useStaticMap ? (
            <StaticMapFallback />
          ) : (
            <MapErrorBoundary
              fallback={
                <StaticMapFallback />
              }
            >
              <MapView
                onSelect={onSelect}
                selectedId={selected?.id ?? null}
                onFatalError={() => setUseStaticMap(true)}
              />
            </MapErrorBoundary>
          )}
        </div>
        <aside className="feed">
          <h2>Feed — last 72h (demo)</h2>
          <ul>
            {DEMO_EVENTS.map((evt) => (
              <li
                key={evt.id}
                className={selected?.id === evt.id ? "active" : ""}
                onClick={() => setSelected(evt)}
              >
                <span className="pill" style={{ background: severityColor[evt.severity] }} />
                <div>
                  <strong>{evt.title}</strong>
                  <span className="muted">{evt.reportedAt.replace("T", " ").slice(0, 16)} UTC</span>
                  <span className="muted">{evt.source}</span>
                  <span className="muted">
                    {evt.lat.toFixed(2)}°, {evt.lng.toFixed(2)}°
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="links">
            <a href="/trainer">Callout trainer</a> (legacy)
            <br />
            <a href="/debug/headers">/debug/headers</a> (EC2 origin)
            <br />
            <a href="https://tunnel.strikemap.space/secure">Live Ops</a> (Zero Trust)
            <br />
            {!useStaticMap ? (
              <button type="button" className="linkish" onClick={() => setUseStaticMap(true)}>
                Use static map fallback
              </button>
            ) : null}
          </div>
        </aside>
      </div>
      <style jsx>{`
        .shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--paper-border);
          background: #0f0e0c;
        }
        .brand {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e05252, #ff8a65);
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 0.75rem;
          color: #111;
        }
        h1 {
          margin: 0;
          font-size: 1rem;
          letter-spacing: 0.08em;
        }
        .muted {
          color: var(--ink-muted);
          font-size: 0.8rem;
          margin: 0;
        }
        .geo {
          max-width: 280px;
          text-align: right;
        }
        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 320px;
          min-height: 0;
        }
        @media (max-width: 900px) {
          .main {
            grid-template-columns: 1fr;
          }
        }
        .map {
          min-height: 480px;
          position: relative;
        }
        .map :global(.map-inner) {
          width: 100%;
          height: 100%;
          min-height: 480px;
        }
        .feed {
          border-left: 1px solid var(--paper-border);
          background: var(--paper-alt);
          padding: 1rem;
          overflow: auto;
        }
        .feed h2 {
          margin: 0 0 0.75rem;
          font-size: 0.9rem;
        }
        .feed ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .feed li {
          display: flex;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 0.35rem;
          border: 1px solid transparent;
        }
        .feed li:hover,
        .feed li.active {
          background: #2a2620;
          border-color: var(--paper-border);
        }
        .feed li strong {
          display: block;
          font-size: 0.82rem;
        }
        .feed li span.muted {
          display: block;
          font-size: 0.72rem;
        }
        .pill {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 0.35rem;
          flex-shrink: 0;
        }
        .links {
          margin-top: 1rem;
          font-size: 0.8rem;
          line-height: 1.6;
        }
        .linkish {
          background: none;
          border: none;
          color: #7eb8ff;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
