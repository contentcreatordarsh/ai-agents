"use client";

import { AnimatePresence } from "framer-motion";
import { useSiteUI } from "./SiteUIContext";
import ModalShell from "@/components/game/ModalShell";
import DeploymentModal from "@/components/game/DeploymentModal";
import LoginModal from "@/components/game/LoginModal";
import CreateBattleFlow from "@/components/game/CreateBattleFlow";
import JoinBattleFlow from "@/components/game/JoinBattleFlow";
import GameConsole from "@/components/game/GameConsole";
import { DEMO_BATTLES } from "@/lib/demo-battles";

export default function SiteModals() {
  const { modal, close, battlePreviewId, open } = useSiteUI();
  const preview = DEMO_BATTLES.find((b) => b.id === battlePreviewId);

  return (
    <AnimatePresence>
      {modal === "demo" ? (
        <GameConsole key="demo" />
      ) : null}
      {modal && modal !== "demo" ? (
        <ModalShell
          key={modal}
          title={
            modal === "deploy"
              ? "DEPLOY"
              : modal === "login"
                ? "LOGIN"
                : modal === "create"
                  ? "CREATE BATTLE"
                  : modal === "join"
                    ? "JOIN BATTLE"
                    : modal === "contact"
                      ? "CONTACT"
                      : "BATTLE PREVIEW"
          }
          onClose={close}
          wide={modal === "create" || modal === "battle-preview"}
        >
          {modal === "deploy" ? <DeploymentModal /> : null}
          {modal === "login" ? <LoginModal /> : null}
          {modal === "create" ? <CreateBattleFlow /> : null}
          {modal === "join" ? <JoinBattleFlow /> : null}
          {modal === "contact" ? (
            <p>Email <a href="mailto:hello@strikemap.space">hello@strikemap.space</a></p>
          ) : null}
          {modal === "battle-preview" && preview ? (
            <div className="preview-body">
              <h3>{preview.city}</h3>
              <p>{preview.status} · {preview.players} players</p>
              <button type="button" className="btn-cta" onClick={() => open("join")}>JOIN BATTLE</button>
              <button type="button" className="btn-outline" onClick={() => open("demo")}>WATCH DEMO</button>
            </div>
          ) : null}
        </ModalShell>
      ) : null}
    </AnimatePresence>
  );
}
