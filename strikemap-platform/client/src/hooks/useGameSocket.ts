import { useEffect, useRef, useState } from "react";
import type { GameSnapshot, WsServerMessage } from "../types/game";

export type ConnStatus = "live" | "reconnecting" | "offline";

export function useGameSocket(opts: {
  gameId: string;
  team: string;
  demo?: boolean;
  enabled: boolean;
}) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [status, setStatus] = useState<ConnStatus>("offline");
  const [events, setEvents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!opts.enabled) return;
    let cancelled = false;
    let watchId: number | null = null;

    const connect = () => {
      setStatus(retryRef.current > 0 ? "reconnecting" : "offline");
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const path = opts.demo
        ? `${proto}://${location.host}/game/demo/ws`
        : `${proto}://${location.host}/game/${opts.gameId}/ws?team=${opts.team}&demo=0`;
      const ws = new WebSocket(path);
      wsRef.current = ws;
      ws.onopen = () => {
        retryRef.current = 0;
        setStatus("live");
      };
      ws.onclose = () => {
        setStatus("offline");
        if (!cancelled) {
          retryRef.current++;
          setTimeout(connect, Math.min(8000, 500 * retryRef.current));
        }
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as WsServerMessage;
        if (msg.type === "state") setSnapshot(msg.state);
        if (msg.type === "event") {
          const e = msg.event;
          if (e.kind === "narration") setEvents((p) => [e.text, ...p].slice(0, 8));
          if (e.kind === "territory_captured")
            setEvents((p) => [`⚡ ${e.territoryId} captured by ${e.team}`, ...p].slice(0, 8));
        }
      };
    };

    connect();

    if (navigator.geolocation && !opts.demo) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          ws.send(
            JSON.stringify({
              type: "player_move",
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now(),
              accuracyM: pos.coords.accuracy,
            }),
          );
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      );
    }

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      wsRef.current?.close();
    };
  }, [opts.gameId, opts.team, opts.demo, opts.enabled]);

  return { snapshot, status, events };
}
