"use client";

import dynamic from "next/dynamic";

const StrikeMapClient = dynamic(() => import("@/components/StrikeMapClient"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "2rem", color: "#a89f8f" }}>Loading StrikeMap…</div>
  ),
});

export default function HomeClient() {
  return <StrikeMapClient />;
}
