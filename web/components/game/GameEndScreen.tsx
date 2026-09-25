"use client";

import Link from "next/link";
import { TEAM_COLORS, type TeamColor } from "@/lib/game/contracts";

type Props = {
  winner: TeamColor;
  scores: Record<string, number>;
};

export default function GameEndScreen({ winner, scores }: Props) {
  const red = scores.RED ?? 0;
  const blue = scores.BLUE ?? 0;
  return (
    <div className="end-overlay glass">
      <h2>BATTLE COMPLETE</h2>
      <div className="scores">
        <div style={{ color: TEAM_COLORS.RED }}>🔴 RED {red}</div>
        <div style={{ color: TEAM_COLORS.BLUE }}>🔵 BLUE {blue}</div>
      </div>
      <p>
        <strong style={{ color: TEAM_COLORS[winner] }}>{winner}</strong> controlled sector 01
      </p>
      <Link href="/battle/create/" className="btn primary">PLAY AGAIN</Link>
      <style jsx>{`
        .end-overlay {
          position: absolute;
          inset: 0;
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .scores {
          font-size: 1.25rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
