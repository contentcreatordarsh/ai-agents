# StrikeMap Platform (Cloudflare-native)

**Your city. Your battlefield.** — Real-world multiplayer on Workers, Durable Objects, D1, KV, R2, Queues, and Workers AI.

## Stack

| Layer | Product |
|--------|---------|
| API + SPA | Cloudflare Workers + Assets |
| Realtime | Durable Objects + WebSockets (`StrikeGameDO`) |
| Database | D1 (users, games, XP, leaderboards) |
| Cache | KV (tickets, config) |
| Assets | R2 (avatars — binding ready) |
| Async | Queues (`strikemap-game-events`) |
| AI | Workers AI binding (mission/narration hooks) |
| Abuse | Turnstile (optional `TURNSTILE_SECRET`) |

## Quick start

```bash
cd strikemap-platform
npm install
npm run db:migrate:local
npm run dev
```

Open http://localhost:8787

## Production setup

1. `wrangler d1 create strikemap-db` — set `database_id` in `wrangler.jsonc`
2. `wrangler kv namespace create strikemap-kv` — set KV id
3. `wrangler r2 bucket create strikemap-assets`
4. `wrangler queues create strikemap-game-events`
5. `npm run db:migrate` (remote)
6. `wrangler secret put TURNSTILE_SECRET` (optional)
7. `npm run deploy`

Route `strikemap.space/*` to this Worker (replace legacy gateway when ready).

## API contracts (authoritative)

- REST base: `https://strikemap.space/api/v1`
- Envelope: `{ ok: true, data }` / `{ ok: false, error: { code, message, requestId } }`
- Auth: `Authorization: Bearer <session token>`
- Realtime: `wss://strikemap.space/ws/games/{gameId}` with `Sec-WebSocket-Protocol: STRIKEMAP_GAME_V1, <short-lived rt_ token>`
- Shared types: `src/shared/contracts/*`

## Demo

- **/demo** — simulated City Battle (DEMO players, territory ticks, supply drops)
- Real multiplayer: signup → `POST /api/v1/games` → share `/join/{code}` → `POST .../realtime/connect` → WebSocket

## Privacy & anti-cheat

- Positions obscured to ~50m before broadcast
- Server-side movement speed validation + risk score
- XP and captures only on server / queue persistence
