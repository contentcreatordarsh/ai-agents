"use client";

import dynamic from "next/dynamic";

const BattleClient = dynamic(() => import("@/components/game/BattleClient"), { ssr: false });

export default function DemoPage() {
  return <BattleClient gameId="demo_city_battle" demo />;
}
