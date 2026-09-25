import { useEffect, useRef, useState } from "react";
import type { GameMessage, GameStatePayload } from "../../../src/shared/contracts/events";
import { WS_PROTOCOL_VERSION } from "../../../src/shared/contracts/events";
import { api, getToken } from "../lib/api";
import type { TeamColor } from "../../../src/shared/contracts/game";

export type ConnStatus = "live" | "reconnecting" | "offline";

export function useGameSocket(opts: {
  gameId: string;
  demo?: boolean;
  enabled: boolean;
}) {
  const [snapshot, setSnapshot] = useState<GameStatePayload | null>(null);
  const [status, setStatus] = useState<ConnStatus>("offline");
  const [events, setEvents] = useState<string[]>([]);
  const lastSequenceRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!opts.enabled) return;
    let cancelled = false;
    let watchId: number | null = null;

    const connect = async () => {
      setStatus(retryRef.current > 0 ? "reconnecting" : "offline");
      const proto = location.protocol === "https:" ? "wss" : "ws";
      let protocols: string[] = [WS_PROTOCOL_VERSION];
      if (!opts.demo) {
        const { token } = await api<{ token: string }>(
          `/api/v1/games/${opts.gameId}/realtime/connect`,
          { method: "POST", body: "{}" },
        );
        protocols.push(token);
      }
      const ws = new WebSocket(`${proto}://${location.host}/ws/games/${opts.gameId}`, protocols);
      wsRef.current = ws;
      ws.onopen = () => {
        retryRef.current = 0;
        setStatus("live");
      };
      ws.onclose = () => {
        setStatus("offline");
        if (!cancelled) {
          retryRef.current++;
          setTimeout(() => void connect(), Math.min(8000, 500 * retryRef.current));
        }
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as GameMessage;
        if (msg.sequence > lastSequenceRef.current + 1 && lastSequenceRef.current > 0) {
          ws.send(
            JSON.stringify({
              type: "REQUEST_SNAPSHOT",
              eventId: crypto.randomUUID(),
              serverTime: new Date().toISOString(),
              gameId: opts.gameId,
              sequence: 0,
              payload: {},
            }),
          );
        }
        if (msg.sequence) lastSequenceRef.current = msg.sequence;
        if (msg.type === "GAME_STATE") setSnapshot(msg.payload as GameStatePayload);
        if (msg.type === "TERRITORY_CAPTURED") {
          const p = msg.payload as { territoryId: string; newOwner: string };
          setEvents((e) => [`⚡ ${p.territoryId} → ${p.newOwner}`, ...e].slice(0, 8));
        }
        if (msg.type === "NOTIFICATION" || msg.type === "OBJECTIVE_CREATED") {
          setEvents((e) => [JSON.stringify(msg.payload), ...e].slice(0, 8));
        }
      };
    };

    void connect();

    if (navigator.geolocation && !opts.demo && getToken()) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const ws = wsRef.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          ws.send(
            JSON.stringify({
              type: "PLAYER_MOVE",
              eventId: crypto.randomUUID(),
              serverTime: new Date().toISOString(),
              gameId: opts.gameId,
              sequence: 0,
              payload: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracyM: pos.coords.accuracy,
                timestamp: new Date().toISOString(),
              },
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
  }, [opts.gameId, opts.demo, opts.enabled]);

  return { snapshot, status, events };
}
