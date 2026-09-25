"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Optional ambient layer — Web Audio, muted by default until user opts in. */
export default function Soundscape() {
  const [muted, setMuted] = useState(true);
  const [armed, setArmed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const stop = useCallback(() => {
    oscRef.current?.stop();
    oscRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  const startAmbient = useCallback(() => {
    if (typeof window === "undefined") return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 52;
    gain.gain.value = 0.015;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ctxRef.current = ctx;
    oscRef.current = osc;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const toggle = () => {
    if (!armed) {
      setArmed(true);
      setMuted(false);
      startAmbient();
      return;
    }
    if (muted) {
      setMuted(false);
      if (!ctxRef.current) startAmbient();
      else ctxRef.current.resume();
    } else {
      setMuted(true);
      ctxRef.current?.suspend();
    }
  };

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? "Enable sound" : "Mute sound"}
    >
      {muted ? "SOUND OFF" : "SOUND ON"}
    </button>
  );
}
