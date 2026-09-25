"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ModalView =
  | null
  | "deploy"
  | "login"
  | "create"
  | "join"
  | "demo"
  | "contact"
  | "battle-preview";

type Ctx = {
  modal: ModalView;
  battlePreviewId: string | null;
  open: (m: ModalView, battleId?: string) => void;
  close: () => void;
  scrollTo: (id: string) => void;
  playerName: string;
  setPlayerName: (n: string) => void;
};

const SiteUIContext = createContext<Ctx | null>(null);

export function SiteUIProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalView>(null);
  const [battlePreviewId, setBattlePreviewId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sm_display_name") ?? "" : "",
  );

  const open = useCallback((m: ModalView, battleId?: string) => {
    setModal(m);
    setBattlePreviewId(battleId ?? null);
  }, []);

  const close = useCallback(() => {
    setModal(null);
    setBattlePreviewId(null);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    close();
  }, [close]);

  const value = useMemo(
    () => ({
      modal,
      battlePreviewId,
      open,
      close,
      scrollTo,
      playerName,
      setPlayerName: (n: string) => {
        setPlayerName(n);
        localStorage.setItem("sm_display_name", n);
      },
    }),
    [modal, battlePreviewId, open, close, scrollTo, playerName],
  );

  return <SiteUIContext.Provider value={value}>{children}</SiteUIContext.Provider>;
}

export function useSiteUI() {
  const ctx = useContext(SiteUIContext);
  if (!ctx) throw new Error("useSiteUI outside provider");
  return ctx;
}
