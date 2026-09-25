# StrikeMap infrastructure status (Cloud Agent)

## Done automatically in this environment

| Item | Value |
|------|--------|
| AWS profile | `strikemap` (`ap-southeast-1`) |
| EC2 instance | `strikemap-origin` (`i-0318f904ceb69d724`) |
| Elastic IP | **54.251.237.209** |
| Origin app | Flask + Next static export (`web_export/`) on nginx → :8080 |
| Direct test | `curl -H "X-Test: 1" http://54.251.237.209/` |

## Workers (production — 2026-09-25)

| Worker | Hostname | Role |
|--------|----------|------|
| **`strikemap-platform`** | https://strikemap.space , https://www.strikemap.space | PR #2 — game SPA, `/api/v1`, WebSockets, D1 `strikemap-db` (`d5b3d6c9-ef06-4a41-87b3-d87aa1d3f05c`), KV `8e95bff…`, queue `strikemap-game-events` |
| **`strikemap-gateway`** | https://map.strikemap.space | PR #1 — Next map UI, `/api/geo`, votes |
| **`se-stand-deliver-secure`** | https://tunnel.strikemap.space/secure* | PR #1 — R2 country flags (Zero Trust in front) |

Redeploy: `docs/CLOUDFLARE_ROUTES_MANUAL.md`.

## DNS

- Apex **`@`** is a **Worker custom domain** (no `A` to EC2).
- **`origin.strikemap.space`** → `54.251.237.209` (proxied) for Flask header echo + `web_export/`.
- Tunnel **`strikemap-origin`** → EC2 `:8080` on `tunnel.strikemap.space`.

## Verified

```bash
curl -sS https://strikemap.space/api/v1/health
curl -sS https://map.strikemap.space/api/geo
curl -sS https://origin.strikemap.space/debug/headers
```
