import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="landing">
      <div className="hero-grid" />
      <header className="nav glass">
        <span className="brand-font">STRIKEMAP</span>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn-primary">Play Now</Link>
        </div>
      </header>
      <main className="hero">
        <div>
          <p className="tag">LIVE · MULTIPLAYER · REAL WORLD</p>
          <h1 className="brand-font">TURN YOUR CITY INTO A BATTLEFIELD</h1>
          <p className="sub">
            StrikeMap turns real-world locations into live multiplayer games. Capture sectors, complete
            objectives, and dominate the leaderboard.
          </p>
          <div className="cta">
            <Link to="/signup" className="btn-primary">Play Now</Link>
            <Link to="/create" className="btn-ghost">Create Battle</Link>
            <Link to="/demo" className="btn-ghost">Watch Demo Battle</Link>
          </div>
        </div>
        <div className="hero-map glass">
          <div className="radar" />
          <p className="brand-font">SINGAPORE SECTOR</p>
          <p className="live">24 PLAYERS ONLINE · DEMO</p>
        </div>
      </main>
      <style>{`
        .landing { min-height: 100vh; position: relative; overflow: hidden; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,255,213,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,213,0.05) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(circle at 50% 30%, black, transparent 70%); }
        .nav { margin: 1rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; }
        .nav-links { display: flex; gap: 0.75rem; align-items: center; }
        .hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2rem; padding: 2rem 1.25rem 4rem; max-width: 1200px; margin: 0 auto; align-items: center; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
        .tag { color: var(--neon-cyan); letter-spacing: 0.2em; font-size: 0.75rem; }
        h1 { font-size: clamp(1.8rem, 4vw, 3rem); margin: 0.5rem 0; line-height: 1.1; }
        .sub { color: var(--muted); font-size: 1.1rem; max-width: 36ch; }
        .cta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
        .hero-map { min-height: 280px; display: grid; place-items: center; position: relative; }
        .radar { position: absolute; width: 180px; height: 180px; border: 2px solid rgba(0,255,213,0.35); border-radius: 50%; animation: pulse 2.5s infinite; }
        .live { color: var(--neon-magenta); letter-spacing: 0.12em; }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.2; } 50% { opacity: 0.7; } 100% { transform: scale(1.2); opacity: 0; } }
      `}</style>
    </div>
  );
}
