"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const BattleClient = dynamic(() => import("@/components/game/BattleClient"), { ssr: false });

function PlayInner() {
  const params = useSearchParams();
  const gameId = params.get("id") ?? "";
  if (!gameId) {
    return <p style={{ padding: "2rem" }}>Missing game id. Use /battle/play/?id=…</p>;
  }
  return <BattleClient gameId={gameId} />;
}

export default function BattlePlayPage() {
  return (
    <Suspense fallback={<p style={{ padding: "2rem" }}>Loading battle…</p>}>
      <PlayInner />
    </Suspense>
  );
}
