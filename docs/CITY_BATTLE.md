# City Battle — multiplayer milestone

## Architecture

```text
strikemap.space
       │
strikemap-gateway (worker-strikemap/)  ← canonical Worker
       │
   ┌───┴───┐
/api/v1   /ws/v1/games/{gameId}
   │           │
   D1          StrikeGameDO (one instance per game)
   KV          WebSockets + authoritative state
```

Game logic is implemented in **`strikemap-platform/src`** and **bundled** from **`worker-strikemap/src/index.ts`**. The separate `strikemap-platform` Worker deploy is optional for local-only experiments; production uses **`worker-strikemap`**.

Legacy intel map + SE assignment paths:

- **`/intel/`** — Next static UI (security demo feed)
- **`map.strikemap.space`** — same intel export
- **`/api/geo`**, **`/debug/*`**, **`origin.strikemap.space`** — unchanged

## Local development

```bash
# Game API + DO (Wrangler dev)
cd worker-strikemap
npm install
cd ../strikemap-platform && npm install && npm run db:migrate:local
cd ../worker-strikemap
npx wrangler dev

# Web UI
cd web && npm install && npm run dev
```

## Migrations

```bash
cd strikemap-platform
npx wrangler d1 migrations apply strikemap-db --remote   # production
npx wrangler d1 migrations apply strikemap-db --local    # dev
```

## Deploy

```bash
cd web && npm run build
cd ../infra && ./build-web-to-worker.sh   # copies web/out → worker-strikemap/public
cd ../worker-strikemap && npm run deploy
```

Custom domains (Wrangler): `strikemap.space`, `www.strikemap.space`, `map.strikemap.space`.

## Multiplayer test (two browsers)

1. Browser A: https://strikemap.space/battle/create/ — sign up, create battle, open lobby link.
2. Copy join code or URL (`/join/CODE`).
3. Browser B: join with code, same battle id.
4. Host starts game (API `POST /api/v1/games/{id}/start` or add UI button).
5. Allow geolocation; move — other client should see `PLAYER_MOVED` in feed.
6. Demo without GPS: https://strikemap.space/demo/ (**DEMO MODE**).

## API surface

- HTTP: `/api/v1/*` only (envelope `{ ok, data }`).
- WebSocket: `wss://strikemap.space/ws/v1/games/{gameId}` with subprotocol `STRIKEMAP_GAME_V1` + `rt_` token (except demo).
