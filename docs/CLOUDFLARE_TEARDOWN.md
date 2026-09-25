# Cloudflare teardown (2026-09-25)

StrikeMap resources removed from account `0fa4850c978886b80a15821863df3855` via Wrangler:

## Deleted Workers
- `strikemap-gateway`
- `strikemap-platform`
- `strikemap-geo-edge`
- `se-stand-deliver-secure`

## Deleted data
- D1: `strikemap-db`
- KV: `strikemap-kv`, `VOTES`
- R2: `strikemap-assets`, `se-country-flags`
- Queue: `strikemap-game-events`

## Not removed by Wrangler (manual)
- **DNS / zone** `strikemap.space`: remove Worker custom domains, routes, and any orphaned records in the Cloudflare dashboard.
- **Cloudflare Tunnel** (if configured for `tunnel.strikemap.space`): Zero Trust → Tunnels.
- **EC2 origin** (`54.251.237.209` / `origin.strikemap.space`): stop or terminate in AWS if no longer needed.
- **Domain registration** at your registrar.

Repo source code is unchanged; only live Cloudflare bindings were deleted.
