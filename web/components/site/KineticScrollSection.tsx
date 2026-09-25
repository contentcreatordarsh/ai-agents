"use client";

const WORDS = ["MOVE", "CONTEST", "CAPTURE", "CONTROL"];

export default function KineticScrollSection() {
  return (
    <section id="kinetic" className="kinetic-section" aria-label="StrikeMap kinetic typography">
      <div className="kinetic-inner">
        {WORDS.map((w) => (
          <span key={w} className="kinetic-word outline">
            {w}
          </span>
        ))}
        <p className="kinetic-tagline">
          CONTROL
          <br />
          YOUR
          <br />
          WORLD
        </p>
      </div>
    </section>
  );
}
