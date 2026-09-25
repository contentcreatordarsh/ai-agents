"use client";

import Link from "next/link";

export default function GameLanding() {
  return (
    <div className="game-landing">
      <header>
        <span className="logo">STRIKEMAP</span>
        <nav>
          <Link href="/intel/">Intel map</Link>
          <Link href="/battle/create/">Create battle</Link>
          <Link href="/join/">Join code</Link>
        </nav>
      </header>
      <main>
        <p className="tag">Your city. Your battlefield.</p>
        <h1>TURN YOUR CITY INTO A BATTLEFIELD</h1>
        <p className="sub">
          Real-world multiplayer. Capture territories. Compete with your team on a live tactical map.
        </p>
        <div className="cta">
          <Link className="btn primary" href="/battle/create/">Create battle</Link>
          <Link className="btn" href="/join/">Join with code</Link>
          <Link className="btn demo" href="/demo/">Watch demo battle</Link>
        </div>
        <p className="footnote">
          Legacy Cloudflare SE / security tooling remains at{" "}
          <Link href="/intel/">/intel</Link> and <code>map.strikemap.space</code>.
        </p>
      </main>
    </div>
  );
}
