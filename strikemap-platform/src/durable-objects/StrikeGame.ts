import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";
import { validateMovement, type MovementState } from "../lib/anticheat";
import { generateHexTerritories } from "../lib/hex";
import { haversineM, obscurePosition, pointInPolygon } from "../lib/geo";
import {
  ALL_TEAM_COLORS,
  type GameStatus,
  type TeamColor,
  teamColorFromDb,
} from "../shared/contracts/game";
import type { GameMessage, PlayerMoveClientPayload } from "../shared/contracts/events";
import type { Objective } from "../shared/contracts/objective";
import type { Player } from "../shared/contracts/player";
import { envelope, GameSequencer } from "./messaging";
import {
  buildContractSnapshot,
  type InternalTerritory,
} from "./snapshot";
import { emptyScores } from "../worker/lib/game-mapper";

type PlayerConn = {
  id: string;
  username: string;
  team: TeamColor;
  demo: boolean;
  ws: WebSocket | null;
  movement: MovementState;
  rawLat: number;
  rawLng: number;
  xp: number;
  level: number;
};

type GameConfig = {
  gameId: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  durationSec: number;
  demo: boolean;
};

const BROADCAST_RADIUS_M = 1000;

export class StrikeGameDO extends DurableObject<Env> {
  private config: GameConfig | null = null;
  private status: GameStatus = "LOBBY";
  private endsAt = 0;
  private startedAt = 0;
  private scores: Record<TeamColor, number> = emptyScores();
  private territories: Map<string, InternalTerritory> = new Map();
  private players: Map<string, PlayerConn> = new Map();
  private objectives: Objective[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private demoTimer: ReturnType<typeof setInterval> | null = null;
  private sequencer = new GameSequencer();
  private clientEventIds = new Set<string>();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request, url);
    }
    if (url.pathname === "/init" && request.method === "POST") {
      await this.initGame((await request.json()) as GameConfig);
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
    if (url.pathname === "/snapshot-contract") {
      return Response.json(this.contractSnapshot());
    }
    if (url.pathname === "/player-join" && request.method === "POST") {
      const body = await request.json() as { playerId: string; username: string; team: TeamColor };
      this.ensurePlayer(body.playerId, body.username, body.team, false);
      this.emit("PLAYER_JOINED", {
        player: { id: body.playerId, username: body.username, team: body.team, level: 1 },
      });
      return Response.json({ ok: true });
    }
    if (url.pathname === "/player-leave" && request.method === "POST") {
      const body = await request.json() as { playerId: string; reason: string };
      this.players.delete(body.playerId);
      this.emit("PLAYER_LEFT", { playerId: body.playerId, reason: body.reason });
      return Response.json({ ok: true });
    }
    if (url.pathname === "/location" && request.method === "POST") {
      const body = await request.json() as PlayerMoveClientPayload & { playerId: string };
      const conn = this.players.get(body.playerId);
      if (!conn) {
        return Response.json({ code: "NOT_A_PLAYER", message: "Not in game" }, { status: 403 });
      }
      const ok = this.applyMove(conn, body);
      if (!ok) {
        return Response.json({ code: "MOVEMENT_TOO_FAST", message: "Rejected" }, { status: 400 });
      }
      return Response.json({ ok: true });
    }
    if (url.pathname === "/leaderboard") {
      const entries = [...this.players.values()]
        .sort((a, b) => b.xp - a.xp)
        .map((p, i) => ({
          rank: i + 1,
          playerId: p.id,
          username: p.username,
          team: p.team,
          score: this.scores[p.team],
          xp: p.xp,
        }));
      return Response.json({ entries });
    }
    return new Response("Not found", { status: 404 });
  }

  private contractSnapshot() {
    const territoryCounts = emptyScores();
    for (const t of this.territories.values()) {
      if (t.ownerTeam) territoryCounts[t.ownerTeam]++;
    }
    const playerCounts = emptyScores();
    for (const p of this.players.values()) playerCounts[p.team]++;
    const players: Player[] = [...this.players.values()].map((p) => ({
      id: p.id,
      username: p.username,
      team: p.team,
      level: p.level,
      xp: p.xp,
      status: p.ws ? "ONLINE" : "OFFLINE",
      stats: { wins: 0, gamesPlayed: 0, territoriesCaptured: 0, currentStreak: 0 },
    }));
    return buildContractSnapshot({
      dbGame: null,
      gameId: this.config?.gameId ?? "",
      status: this.status,
      scores: this.scores,
      territoryCounts,
      playerCounts,
      territories: [...this.territories.values()],
      players,
      objectives: this.objectives,
    });
  }

  private async initGame(cfg: GameConfig) {
    this.config = cfg;
    this.status = cfg.demo ? "ACTIVE" : "LOBBY";
    this.endsAt = Date.now() + cfg.durationSec * 1000;
    this.startedAt = cfg.demo ? Date.now() : 0;
    this.scores = { RED: 2840, BLUE: 3120, PURPLE: 1920, GREEN: 2410 };
    if (!cfg.demo) this.scores = emptyScores();
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
    const names = ["DEMO_Alpha", "DEMO_Bravo", "DEMO_Charlie", "DEMO_Delta", "DEMO_Echo", "DEMO_Foxtrot"];
    let i = 0;
    for (const name of names) {
      const team = ALL_TEAM_COLORS[i % ALL_TEAM_COLORS.length];
      const id = `demo_${i}`;
      const offset = (i - 2) * 120;
      const lat = this.config.centerLat + offset / 111_320;
      const lng = this.config.centerLng;
      this.ensurePlayer(id, name, team, true, lat, lng);
      const p = this.players.get(id)!;
      p.xp = 800 + i * 120;
      i++;
    }
  }

  private ensurePlayer(
    id: string,
    username: string,
    team: TeamColor,
    demo: boolean,
    lat = 0,
    lng = 0,
  ) {
    if (this.players.has(id)) return;
    this.players.set(id, {
      id,
      username,
      team,
      demo,
      ws: null,
      movement: { lastLat: lat, lastLng: lng, lastTs: Date.now(), riskScore: 0, updatesInWindow: 0, windowStart: Date.now() },
      rawLat: lat,
      rawLng: lng,
      xp: 0,
      level: 1,
    });
  }

  private async handleWebSocket(request: Request, url: URL): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const playerId = request.headers.get("X-StrikeMap-Player-Id");
    const username = request.headers.get("X-StrikeMap-Username") ?? "Agent";
    const team = teamColorFromDb(request.headers.get("X-StrikeMap-Team") ?? "BLUE");
    const demo = request.headers.get("X-StrikeMap-Demo") === "1";
    if (!playerId) return new Response("missing player", { status: 401 });

    const lat = parseFloat(request.headers.get("X-StrikeMap-Lat") ?? "0");
    const lng = parseFloat(request.headers.get("X-StrikeMap-Lng") ?? "0");
    this.ensurePlayer(playerId, username, team, demo, lat, lng);
    const conn = this.players.get(playerId)!;
    conn.ws = server;
    this.ctx.acceptWebSocket(server, [playerId]);

    this.sendTo(conn, this.makeMessage("GAME_STATE", this.contractSnapshot()));
    if (this.status === "ACTIVE" && !this.tickTimer) this.startTick();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    const conn = playerId ? this.players.get(playerId) : undefined;
    if (!conn) return;
    try {
      const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
      const msg = JSON.parse(raw) as GameMessage;
      if (msg.eventId && this.clientEventIds.has(msg.eventId)) return;
      if (msg.eventId) this.clientEventIds.add(msg.eventId);

      switch (msg.type) {
        case "PING":
          this.sendTo(conn, this.makeMessage("PONG", { clientTime: (msg.payload as { clientTime?: string })?.clientTime }));
          break;
        case "REQUEST_SNAPSHOT":
          this.sendTo(conn, this.makeMessage("GAME_STATE", this.contractSnapshot()));
          break;
        case "PLAYER_MOVE":
          if (this.status !== "ACTIVE") {
            this.sendError(conn, "GAME_NOT_ACTIVE", "Game not active");
            return;
          }
          const payload = msg.payload as PlayerMoveClientPayload;
          const ok = this.applyMove(conn, payload);
          if (!ok) this.sendError(conn, "MOVEMENT_TOO_FAST", "Location update rejected");
          break;
        case "CLAIM_OBJECTIVE":
        case "CLAIM_SUPPLY_DROP":
          this.handleClaim(conn, msg);
          break;
        default:
          this.sendError(conn, "INVALID_EVENT", "Unknown event type");
      }
    } catch {
      this.sendError(conn, "INVALID_EVENT", "Malformed message");
    }
  }

  private handleClaim(conn: PlayerConn, msg: GameMessage) {
    const objectiveId = (msg.payload as { objectiveId?: string })?.objectiveId;
    const obj = this.objectives.find((o) => o.id === objectiveId && o.status === "ACTIVE");
    if (!obj) {
      this.sendError(conn, "OBJECTIVE_NOT_FOUND", "Objective not found");
      return;
    }
    const dist = haversineM({ lat: conn.rawLat, lng: conn.rawLng }, obj.location);
    if (dist > obj.radiusM) {
      this.sendError(conn, "NOT_IN_RANGE", "Not in range");
      return;
    }
    obj.status = "COMPLETED";
    obj.completedBy = conn.id;
    conn.xp += obj.rewardXp;
    this.emit("OBJECTIVE_COMPLETED", {
      objectiveId: obj.id,
      playerId: conn.id,
      rewardXp: obj.rewardXp,
      rewardCredits: obj.rewardCredits ?? 0,
    });
    this.emit("XP_AWARDED", {
      playerId: conn.id,
      amount: obj.rewardXp,
      reason: obj.type,
      newTotalXp: conn.xp,
    });
    this.emit("SCORE_UPDATED", { scores: this.scores });
  }

  private applyMove(conn: PlayerConn, payload: PlayerMoveClientPayload): boolean {
    const ts = Date.parse(payload.timestamp) || Date.now();
    const v = validateMovement(conn.movement, payload.lat, payload.lng, ts);
    conn.movement = v.next;
    if (!v.ok) return false;
    if (this.config) {
      const dist = haversineM(
        { lat: this.config.centerLat, lng: this.config.centerLng },
        { lat: payload.lat, lng: payload.lng },
      );
      if (dist > this.config.radiusM) return false;
    }
    conn.rawLat = payload.lat;
    conn.rawLng = payload.lng;
    this.updatePlayerTerritories(conn);
    const obscured = obscurePosition(payload.lat, payload.lng, 50);
    this.broadcastPlayerMoved(conn, obscured.lat, obscured.lng);
    return true;
  }

  private broadcastPlayerMoved(conn: PlayerConn, lat: number, lng: number) {
    const msg = this.makeMessage("PLAYER_MOVED", {
      playerId: conn.id,
      location: { lat, lng },
      team: conn.team,
      updatedAt: new Date().toISOString(),
    });
    for (const p of this.players.values()) {
      if (!p.ws || p.ws.readyState !== WebSocket.OPEN) continue;
      if (p.id === conn.id) {
        this.sendTo(p, msg);
        continue;
      }
      const d = haversineM({ lat: conn.rawLat, lng: conn.rawLng }, { lat: p.rawLat, lng: p.rawLng });
      if (d <= BROADCAST_RADIUS_M) this.sendTo(p, msg);
    }
  }

  async webSocketClose(ws: WebSocket) {
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    if (playerId) {
      const p = this.players.get(playerId);
      if (p) p.ws = null;
      this.emit("PLAYER_LEFT", { playerId, reason: "DISCONNECTED" });
    }
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
    this.tickTimer = setInterval(() => this.gameTick(), 1000);
  }

  private gameTick() {
    if (!this.config) return;
    if (this.status === "ACTIVE" && Date.now() >= this.endsAt) {
      void this.endGame();
      return;
    }
    for (const t of this.territories.values()) {
      const teamsPresent = new Map<TeamColor, number>();
      for (const pid of t.playersInside) {
        const p = this.players.get(pid);
        if (!p) continue;
        teamsPresent.set(p.team, (teamsPresent.get(p.team) ?? 0) + 1);
      }
      let dominant: TeamColor | null = null;
      let max = 0;
      for (const [team, count] of teamsPresent) {
        if (count > max) {
          max = count;
          dominant = team;
        }
      }
      const contested = teamsPresent.size > 1;
      if (contested) {
        this.emit("TERRITORY_CONTESTED", {
          territoryId: t.id,
          teams: [...teamsPresent.keys()],
          captureProgress: t.captureProgress,
        });
      }
      if (!dominant || contested) {
        t.capturingTeam = null;
        continue;
      }
      if (t.ownerTeam === dominant) continue;
      if (t.captureProgress === 0) {
        this.emit("TERRITORY_CAPTURE_STARTED", { territoryId: t.id, team: dominant, captureProgress: 0 });
      }
      t.capturingTeam = dominant;
      t.captureProgress = Math.min(100, t.captureProgress + 4 + max * 2);
      this.emit("TERRITORY_UPDATED", {
        territory: {
          id: t.id,
          ownerTeam: t.ownerTeam,
          status: "CONTESTED",
          captureProgress: t.captureProgress,
          health: t.health,
          playersPresent: t.playersInside.size,
        },
      });
      if (t.captureProgress >= 100) {
        const previousOwner = t.ownerTeam;
        t.ownerTeam = dominant;
        t.captureProgress = 0;
        t.capturingTeam = null;
        t.health = 100;
        this.scores[dominant] += 250;
        const capturedBy = [...t.playersInside].filter((id) => this.players.get(id)?.team === dominant);
        for (const pid of capturedBy) {
          const p = this.players.get(pid);
          if (p) p.xp += 250;
        }
        this.emit("TERRITORY_CAPTURED", {
          territoryId: t.id,
          previousOwner,
          newOwner: dominant,
          capturedBy,
          xpAwarded: 250,
          scoreAwarded: 250,
        });
        this.emit("SCORE_UPDATED", { scores: this.scores });
        void this.persistTerritoryEvent(t.id, dominant);
      }
    }
    this.broadcast(this.makeMessage("GAME_STATE", this.contractSnapshot()));
  }

  private async persistTerritoryEvent(territoryId: string, team: TeamColor) {
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
        p.rawLat += (Math.random() - 0.5) * 0.0008;
        p.rawLng += (Math.random() - 0.5) * 0.0008;
        this.updatePlayerTerritories(p);
      }
      if (Math.random() < 0.08) this.spawnSupplyDrop();
    }, 2000);
  }

  private spawnSupplyDrop() {
    if (!this.config) return;
    const t = [...this.territories.values()][Math.floor(Math.random() * this.territories.size)];
    if (!t) return;
    const obj: Objective = {
      id: `supply_${Date.now()}`,
      type: "SUPPLY_DROP",
      title: "Legendary Supply Drop",
      description: "Secure the drop before it expires",
      location: { lat: t.center.lat, lng: t.center.lng },
      radiusM: 50,
      rewardXp: 750,
      rewardCredits: 1000,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 180_000).toISOString(),
    };
    this.objectives = [obj, ...this.objectives].slice(0, 5);
    this.emit("SUPPLY_DROP_CREATED", { objective: obj });
    this.emit("OBJECTIVE_CREATED", { objective: obj });
  }

  private async startGame() {
    if (!this.config) return;
    this.status = "COUNTDOWN";
    for (let n = 10; n >= 1; n -= n > 3 ? 1 : 1) {
      if (n <= 3) this.emit("GAME_COUNTDOWN", { secondsRemaining: n });
      await new Promise((r) => setTimeout(r, n > 3 ? 700 : 800));
    }
    this.status = "ACTIVE";
    this.startedAt = Date.now();
    this.endsAt = Date.now() + this.config.durationSec * 1000;
    this.startTick();
    this.emit("GAME_STARTED", {
      startedAt: new Date(this.startedAt).toISOString(),
      endsAt: new Date(this.endsAt).toISOString(),
    });
    this.broadcast(this.makeMessage("GAME_STATE", this.contractSnapshot()));
  }

  private async endGame() {
    this.status = "FINISHED";
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.tickTimer = null;
    this.demoTimer = null;
    const winning = ALL_TEAM_COLORS.reduce((a, b) => (this.scores[a] >= this.scores[b] ? a : b));
    this.emit("GAME_FINISHED", {
      winnerTeam: winning,
      finalScores: this.scores,
      stats: {
        territoriesCaptured: [...this.territories.values()].filter((t) => t.ownerTeam).length,
        objectivesCompleted: this.objectives.filter((o) => o.status === "COMPLETED").length,
        players: this.players.size,
      },
    });
    if (this.config && !this.config.demo) {
      await this.env.GAME_EVENTS.send({
        type: "game_ended",
        gameId: this.config.gameId,
        winningTeam: winning,
        scores: this.scores,
        at: Date.now(),
      });
    }
  }

  private makeMessage<T>(type: GameMessage["type"], payload: T): GameMessage<T> {
    return envelope(this.config?.gameId ?? "unknown", type as never, payload, this.sequencer);
  }

  private emit<T>(type: GameMessage["type"], payload: T) {
    this.broadcast(this.makeMessage(type, payload));
  }

  private sendError(conn: PlayerConn, code: string, message: string) {
    this.sendTo(
      conn,
      this.makeMessage("ERROR", { code, message, retryable: code === "RATE_LIMITED" }),
    );
  }

  private sendTo(conn: PlayerConn, msg: GameMessage) {
    if (conn.ws?.readyState === WebSocket.OPEN) conn.ws.send(JSON.stringify(msg));
  }

  private broadcast(msg: GameMessage) {
    const data = JSON.stringify(msg);
    for (const p of this.players.values()) {
      if (p.ws?.readyState === WebSocket.OPEN) p.ws.send(data);
    }
  }
}
