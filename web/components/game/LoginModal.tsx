"use client";

import { useState } from "react";
import { useSiteUI } from "@/components/site/SiteUIContext";

export default function LoginModal() {
  const { playerName, setPlayerName, close } = useSiteUI();
  const [name, setName] = useState(playerName);

  return (
    <form
      className="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return;
        setPlayerName(name.trim().toUpperCase());
        close();
      }}
    >
      <label>
        PLAYER NAME
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="DARSH"
          autoComplete="username"
          maxLength={24}
        />
      </label>
      <button type="submit" className="btn-cta full">ENTER STRIKEMAP</button>
      <p className="hint">Lightweight display name for this slice. Full auth via API when deploying.</p>
    </form>
  );
}
