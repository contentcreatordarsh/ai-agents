"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/game/api";
import {
  WS_PROTOCOL_VERSION,
  type GameMessage,
  type GameStatePayload,
  type TeamColor,
} from "@/lib/game/contracts";

export type ConnStatus = "live" | "reconnecting" | "offline";

export function useGameSocket(opts: {
  gameId: string;
  demo?: boolean;
  enabled: boolean;
}) {
  const [snapshot, setSnapshot] = useState<GameStatePayload | null>(null);
  const [status, setStatus] = useState<ConnStatus>("offline");
  const [events, setEvents] = useState<string[]>([]);
  const [finished, setFinished] = useState<{ winner: TeamColor; scores: Record<string, number> } | null>(null);
  const lastSequenceRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!opts.enabled || !opts.gameId) return;
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
      const ws = new WebSocket(
        `${proto}://${location.host}/ws/v1/games/${opts.gameId}`,
        protocols,
      );
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

        if (msg.type === "PLAYER_MOVED") {
          const p = msg.payload as {
            playerId: string;
            username?: string;
            location: { lat: number; lng: number };
            team: TeamColor;
          };
          setSnapshot((prev) => {
            if (!prev) return prev;
            const players = prev.players.map((pl) =>
              pl.id === p.playerId
                ? {
                    ...pl,
                    location: { ...p.location, updatedAt: new Date().toISOString() },
                  }
                : pl,
            );
            return { ...prev, players };
          });
        }

        if (msg.type === "TERRITORY_UPDATED" || msg.type === "TERRITORY_CAPTURED") {
          const t = msg.payload as { territory?: GameStatePayload["territories"][0]; territoryId?: string; newOwner?: string };
          if (msg.type === "TERRITORY_CAPTURED") {
            setEvents((e) => [`⚡ SECTOR CAPTURED · ${t.newOwner} +250`, ...e].slice(0, 6));
          }
          setSnapshot((prev) => {
            if (!prev) return prev;
            const territory = (t as { territory?: GameStatePayload["territories"][0] }).territory;
            if (territory) {
              const territories = prev.territories.map((x) => (x.id === territory.id ? { ...x, ...territory } : x));
              return { ...prev, territories };
            }
            if (t.territoryId && t.newOwner) {
              const territories = prev.territories.map((x) =>
                x.id === t.territoryId
                  ? { ...x, ownerTeam: t.newOwner as TeamColor, captureProgress: 100, status: "CONTROLLED" as const }
                  : x,
              );
              return { ...prev, territories };
            }
            return prev;
          });
        }

        if (msg.type === "SCORE_UPDATED") {
          const sc = (msg.payload as { scores: Record<string, number> }).scores;
          setSnapshot((prev) => {
            if (!prev) return prev;
            const teams = prev.teams.map((tm) => ({
              ...tm,
              score: sc[tm.color] ?? tm.score,
            }));
            return { ...prev, teams };
          });
        }

        if (msg.type === "GAME_FINISHED") {
          const p = msg.payload as { winnerTeam: TeamColor; finalScores: Record<string, number> };
          setFinished({ winner: p.winnerTeam, scores: p.finalScores });
        }
      };
    };

    void connect();

    if (navigator.geolocation && !opts.demo) {
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
                timestamp: new Date(pos.timestamp).toISOString(),
              },
            }),
          );
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      );
    }

    return () => {
      cancelled = true;
      wsRef.current?.close();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [opts.enabled, opts.gameId, opts.demo]);

  const sendSimulatedMove = (lat: number, lng: number) => {
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
          lat,
          lng,
          accuracyM: 12,
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  return { snapshot, status, events, finished, sendSimulatedMove };
}
