# StrikeMap Platform (Cloudflare-native MVP)

Full-stack multiplayer game lives in **`strikemap-platform/`**.

## Architecture

- **Worker** `strikemap-platform` — Hono API + SPA assets
- **Durable Object** `StrikeGameDO` — per-game WebSocket authority (territories, scores, capture ticks, demo sim)
- **D1** — users, sessions, games, XP, leaderboards
- **KV** — config / tickets (binding `KV`)
- **Queues** — `strikemap-game-events` → D1 persistence
- **R2** — `strikemap-assets` (avatars)
- **Workers AI** — binding ready for async mission/narration

## Local dev (verified)

```bash
cd strikemap-platform
npm install
npm run db:migrate:local
npm run dev   # http://localhost:8787
```

## Production deploy (manual)

1. `wrangler d1 create strikemap-db` → set `database_id` in `wrangler.jsonc`
2. `npm run db:migrate` with `--remote`
3. KV namespace id is set (`8e95bff391804f2e8cfb79caa164a3fc`)
4. `npm run deploy`
5. Route **strikemap.space/** to `strikemap-platform` (replace or coexist with `strikemap-gateway`)

Token used in CI/agents may lack D1 create — use dashboard OAuth locally for first deploy.

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Landing (cyberpunk tactical) |
| `/demo` | Demo City Battle (simulated players) |
| `/api/auth/*` | Signup / login / session cookie |
| `/api/games` | Create battle, join code, start/end |
| `/game/:id/ws` | Authenticated realtime |
| `/game/demo/ws` | Public demo socket |

Legacy EC2/assignment stack under `origin/`, `worker-strikemap/` remains until DNS cutover.
