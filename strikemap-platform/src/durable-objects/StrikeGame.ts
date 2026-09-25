import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";
import { validateMovement, type MovementState } from "../lib/anticheat";
import { generateHexTerritories } from "../lib/hex";
import { haversineM, obscurePosition, pointInPolygon } from "../lib/geo";
import type {
  GameEvent,
  GameSnapshot,
  GameStatus,
  ObjectiveSnapshot,
  PlayerSnapshot,
  TeamId,
  TerritorySnapshot,
  WsClientMessage,
  WsServerMessage,
} from "../types/game";
import { TEAMS } from "../types/game";

type PlayerConn = {
  id: string;
  username: string;
  team: TeamId;
  demo: boolean;
  ws: WebSocket | null;
  movement: MovementState;
  rawLat: number;
  rawLng: number;
  xp: number;
};

type TerritoryState = TerritorySnapshot & { playersInside: Set<string> };

type GameConfig = {
  gameId: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  durationSec: number;
  demo: boolean;
};

export class StrikeGameDO extends DurableObject<Env> {
  private config: GameConfig | null = null;
  private status: GameStatus = "lobby";
  private endsAt = 0;
  private scores: Record<TeamId, number> = { red: 0, blue: 0, purple: 0, green: 0 };
  private territories: Map<string, TerritoryState> = new Map();
  private players: Map<string, PlayerConn> = new Map();
  private objectives: ObjectiveSnapshot[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private demoTimer: ReturnType<typeof setInterval> | null = null;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request, url);
    }
    if (url.pathname === "/init" && request.method === "POST") {
      const body = (await request.json()) as GameConfig;
      await this.initGame(body);
      return Response.json({ ok: true });
    }
    if (url.pathname === "/start" && request.method === "POST") {
      await this.startGame();
      return Response.json({ ok: true });
    }
    if (url.pathname === "/end" && request.method === "POST") {
      await this.endGame();
      return Response.json({ ok: true });
    }
    if (url.pathname === "/snapshot") {
      return Response.json(this.buildSnapshot());
    }
    return new Response("Not found", { status: 404 });
  }

  private async initGame(cfg: GameConfig) {
    this.config = cfg;
    this.status = cfg.demo ? "active" : "lobby";
    this.endsAt = Date.now() + cfg.durationSec * 1000;
    this.scores = { red: 0, blue: 0, purple: 0, green: 0 };
    this.territories.clear();
    const hexSize = Math.max(80, Math.min(200, cfg.radiusM / 8));
    const hexes = generateHexTerritories(cfg.centerLat, cfg.centerLng, cfg.radiusM, hexSize);
    for (const h of hexes) {
      this.territories.set(h.id, {
        id: h.id,
        center: h.center,
        polygon: h.polygon,
        ownerTeam: null,
        captureProgress: 0,
        capturingTeam: null,
        health: 100,
        playersInside: new Set(),
      });
    }
    if (cfg.demo) {
      this.seedDemoPlayers();
      this.startTick();
      this.startDemoSimulation();
    }
  }

  private seedDemoPlayers() {
    if (!this.config) return;
    const names = [
      "DEMO_Alpha",
      "DEMO_Bravo",
      "DEMO_Charlie",
      "DEMO_Delta",
      "DEMO_Echo",
      "DEMO_Foxtrot",
    ];
    let i = 0;
    for (const name of names) {
      const team = TEAMS[i % TEAMS.length];
      const id = `demo_${i}`;
      const offset = (i - 2) * 120;
      const lat = this.config.centerLat + offset / 111_320;
      const lng = this.config.centerLng;
      this.players.set(id, {
        id,
        username: name,
        team,
        demo: true,
        ws: null,
        movement: { lastLat: lat, lastLng: lng, lastTs: Date.now(), riskScore: 0, updatesInWindow: 0, windowStart: Date.now() },
        rawLat: lat,
        rawLng: lng,
        xp: 800 + i * 120,
      });
      i++;
    }
    this.scores = { red: 2840, blue: 3120, purple: 1920, green: 2410 };
  }

  private async handleWebSocket(request: Request, url: URL): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const playerId = url.searchParams.get("playerId");
    const username = url.searchParams.get("username") ?? "Agent";
    const team = (url.searchParams.get("team") ?? "blue") as TeamId;
    const demo = url.searchParams.get("demo") === "1";

    if (!playerId) {
      return new Response("playerId required", { status: 400 });
    }

    const lat = parseFloat(url.searchParams.get("lat") ?? "0");
    const lng = parseFloat(url.searchParams.get("lng") ?? "0");
    const conn: PlayerConn = {
      id: playerId,
      username,
      team,
      demo,
      ws: server,
      movement: { lastLat: lat, lastLng: lng, lastTs: Date.now(), riskScore: 0, updatesInWindow: 0, windowStart: Date.now() },
      rawLat: lat,
      rawLng: lng,
      xp: 0,
    };
    this.players.set(playerId, conn);
    this.ctx.acceptWebSocket(server, [playerId]);

    server.send(
      JSON.stringify({
        type: "welcome",
        playerId,
        gameId: this.config?.gameId ?? "unknown",
        team,
        demo,
      } satisfies WsServerMessage),
    );
    this.broadcastState();

    if (this.status === "active" && !this.tickTimer) this.startTick();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    const conn = playerId ? this.players.get(playerId) : undefined;
    if (!conn) return;
    try {
      const msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message)) as WsClientMessage;
      this.onClientMessage(conn, msg);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "invalid_message" } satisfies WsServerMessage));
    }
  }

  async webSocketClose(ws: WebSocket) {
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    if (playerId) {
      this.players.delete(playerId);
      this.broadcastState();
    }
  }

  private onClientMessage(conn: PlayerConn, msg: WsClientMessage) {
    if (msg.type === "ping") {
      conn.ws.send(JSON.stringify({ type: "pong", t: msg.t } satisfies WsServerMessage));
      return;
    }
    if (msg.type !== "player_move" || this.status !== "active") return;

    const v = validateMovement(conn.movement, msg.lat, msg.lng, msg.timestamp);
    conn.movement = v.next;
    if (!v.ok) {
      conn.ws.send(
        JSON.stringify({
          type: "event",
          event: { kind: "player_flagged", playerId: conn.id, reason: v.reason ?? "invalid" },
        } satisfies WsServerMessage),
      );
      return;
    }
    conn.rawLat = msg.lat;
    conn.rawLng = msg.lng;
    this.updatePlayerTerritories(conn);
    this.broadcastState();
  }

  private updatePlayerTerritories(conn: PlayerConn) {
    for (const t of this.territories.values()) {
      const inside = pointInPolygon({ lat: conn.rawLat, lng: conn.rawLng }, t.polygon);
      if (inside) t.playersInside.add(conn.id);
      else t.playersInside.delete(conn.id);
    }
  }

  private startTick() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => {
      this.gameTick();
    }, 1000);
  }

  private gameTick() {
    if (!this.config) return;
    if (this.status === "active" && Date.now() >= this.endsAt) {
      void this.endGame();
      return;
    }
    for (const t of this.territories.values()) {
      const teamsPresent = new Map<TeamId, number>();
      for (const pid of t.playersInside) {
        const p = this.players.get(pid);
        if (!p) continue;
        teamsPresent.set(p.team, (teamsPresent.get(p.team) ?? 0) + 1);
      }
      let dominant: TeamId | null = null;
      let max = 0;
      for (const [team, count] of teamsPresent) {
        if (count > max) {
          max = count;
          dominant = team;
        }
      }
      const contested = teamsPresent.size > 1;
      if (!dominant || contested) {
        t.capturingTeam = null;
        continue;
      }
      if (t.ownerTeam === dominant) continue;
      t.capturingTeam = dominant;
      t.captureProgress = Math.min(100, t.captureProgress + 4 + max * 2);
      if (t.captureProgress >= 100) {
        const prev = t.ownerTeam;
        t.ownerTeam = dominant;
        t.captureProgress = 0;
        t.capturingTeam = null;
        t.health = 100;
        this.scores[dominant] += 250;
        const xp = 250;
        for (const pid of t.playersInside) {
          const p = this.players.get(pid);
          if (p?.team === dominant) p.xp += xp;
        }
        this.broadcastEvent({ kind: "territory_captured", territoryId: t.id, team: dominant, xp });
        void this.persistTerritoryEvent(t.id, dominant);
      }
    }
    this.broadcastState();
  }

  private async persistTerritoryEvent(territoryId: string, team: TeamId) {
    if (!this.config || this.config.demo) return;
    await this.env.GAME_EVENTS.send({
      type: "territory_captured",
      gameId: this.config.gameId,
      territoryId,
      team,
      at: Date.now(),
    });
  }

  private startDemoSimulation() {
    if (this.demoTimer) return;
    this.demoTimer = setInterval(() => {
      if (!this.config?.demo) return;
      for (const p of this.players.values()) {
        if (!p.demo) continue;
        const jitterLat = (Math.random() - 0.5) * 0.0008;
        const jitterLng = (Math.random() - 0.5) * 0.0008;
        p.rawLat += jitterLat;
        p.rawLng += jitterLng;
        this.updatePlayerTerritories(p);
      }
      if (Math.random() < 0.08) this.spawnSupplyDrop();
    }, 2000);
  }

  private spawnSupplyDrop() {
    if (!this.config) return;
    const t = [...this.territories.values()][Math.floor(Math.random() * this.territories.size)];
    if (!t) return;
    const obj: ObjectiveSnapshot = {
      id: `drop_${Date.now()}`,
      kind: "supply_drop",
      title: "SUPPLY DROP",
      lat: t.center.lat,
      lng: t.center.lng,
      rewardXp: 750,
      expiresAt: Date.now() + 180_000,
    };
    this.objectives = [obj, ...this.objectives].slice(0, 5);
    this.broadcastEvent({ kind: "supply_drop", title: obj.title, lat: obj.lat, lng: obj.lng });
    this.broadcastEvent({
      kind: "narration",
      text: "A high-value supply drop has appeared on the grid.",
    });
  }

  private async startGame() {
    if (!this.config) return;
    this.status = "countdown";
    for (let n = 3; n >= 1; n--) {
      this.broadcast({ type: "countdown", n });
      await new Promise((r) => setTimeout(r, 800));
    }
    this.broadcast({ type: "strike" });
    this.status = "active";
    this.endsAt = Date.now() + this.config.durationSec * 1000;
    this.startTick();
    this.broadcastEvent({
      kind: "narration",
      text: "CITY BATTLE ACTIVE — CAPTURE THE CITY.",
    });
    this.broadcastState();
  }

  private async endGame() {
    this.status = "ended";
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.tickTimer = null;
    this.demoTimer = null;
    const winning = TEAMS.reduce((a, b) => (this.scores[a] >= this.scores[b] ? a : b));
    if (this.config && !this.config.demo) {
      await this.env.GAME_EVENTS.send({
        type: "game_ended",
        gameId: this.config.gameId,
        winningTeam: winning,
        scores: this.scores,
        at: Date.now(),
      });
    }
    this.broadcastEvent({ kind: "narration", text: `Battle complete. ${winning.toUpperCase()} leads the sector.` });
    this.broadcastState();
  }

  private buildSnapshot(): GameSnapshot {
    const precision = 50;
    const players: PlayerSnapshot[] = [];
    for (const p of this.players.values()) {
      const pos =
        p.rawLat && p.rawLng
          ? obscurePosition(p.rawLat, p.rawLng, precision)
          : null;
      players.push({
        id: p.id,
        username: p.username,
        team: p.team,
        position: pos,
        demo: p.demo,
        xp: p.xp,
        riskScore: p.movement.riskScore,
      });
    }
    const territories = [...this.territories.values()].map((t) => ({
      id: t.id,
      center: t.center,
      polygon: t.polygon,
      ownerTeam: t.ownerTeam,
      captureProgress: t.captureProgress,
      capturingTeam: t.capturingTeam,
      health: t.health,
    }));
    const timeRemainingSec = Math.max(0, Math.floor((this.endsAt - Date.now()) / 1000));
    return {
      gameId: this.config?.gameId ?? "",
      status: this.status,
      timeRemainingSec,
      scores: this.scores,
      territories,
      players,
      objectives: this.objectives.filter((o) => !o.expiresAt || o.expiresAt > Date.now()),
      demo: this.config?.demo ?? false,
    };
  }

  private broadcastState() {
    this.broadcast({ type: "state", state: this.buildSnapshot() });
  }

  private broadcastEvent(event: GameEvent) {
    this.broadcast({ type: "event", event });
  }

  private broadcast(msg: WsServerMessage) {
    const data = JSON.stringify(msg);
    for (const p of this.players.values()) {
      if (p.ws?.readyState === WebSocket.OPEN) {
        try {
          p.ws.send(data);
        } catch {
          /* ignore */
        }
      }
    }
  }
}
