"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MapCamera } from "@/lib/art-direction";
import { WORLD_CAMERAS } from "@/lib/art-direction";

export type CursorMode = "default" | "explore" | "play" | "join" | "capture" | "drag";

type WorldCtx = {
  camera: MapCamera;
  setCamera: (c: MapCamera) => void;
  focusScene: (key: keyof typeof WORLD_CAMERAS) => void;
  focusBattle: (lng: number, lat: number) => void;
  hoveredBattleId: string | null;
  setHoveredBattleId: (id: string | null) => void;
  cursorMode: CursorMode;
  setCursorMode: (m: CursorMode) => void;
  cursorHint: string;
  setCursorHint: (h: string) => void;
  scrollScene: string;
  setScrollScene: (s: string) => void;
};

const WorldSceneContext = createContext<WorldCtx | null>(null);

export function WorldSceneProvider({ children }: { children: React.ReactNode }) {
  const [camera, setCamera] = useState<MapCamera>(WORLD_CAMERAS.hero);
  const [hoveredBattleId, setHoveredBattleId] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");
  const [cursorHint, setCursorHint] = useState("");
  const [scrollScene, setScrollScene] = useState("hero");

  const focusScene = useCallback((key: keyof typeof WORLD_CAMERAS) => {
    setCamera(WORLD_CAMERAS[key]);
    setScrollScene(key);
  }, []);

  const focusBattle = useCallback((lng: number, lat: number) => {
    setCamera({ lng, lat, zoom: 12.6, pitch: 58, bearing: -12 });
  }, []);

  const value = useMemo(
    () => ({
      camera,
      setCamera,
      focusScene,
      focusBattle,
      hoveredBattleId,
      setHoveredBattleId,
      cursorMode,
      setCursorMode,
      cursorHint,
      setCursorHint,
      scrollScene,
      setScrollScene,
    }),
    [camera, focusScene, focusBattle, hoveredBattleId, cursorMode, cursorHint, scrollScene],
  );

  return <WorldSceneContext.Provider value={value}>{children}</WorldSceneContext.Provider>;
}

export function useWorldScene() {
  const ctx = useContext(WorldSceneContext);
  if (!ctx) throw new Error("useWorldScene outside provider");
  return ctx;
}
