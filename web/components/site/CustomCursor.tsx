"use client";

import { useEffect, useState } from "react";
import { useWorldScene } from "@/components/world/WorldSceneContext";

export default function CustomCursor() {
  const { cursorMode, cursorHint } = useWorldScene();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    document.body.classList.add("custom-cursor-active");

    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`strike-cursor mode-${cursorMode}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      aria-hidden
    >
      <span className="strike-cursor-ring" />
      {cursorHint ? <span className="strike-cursor-hint">{cursorHint}</span> : null}
    </div>
  );
}
