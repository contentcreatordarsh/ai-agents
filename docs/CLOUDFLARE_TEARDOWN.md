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

## DNS / tunnel / EC2 (2026-09-25 follow-up)
- **Worker routes** on zone `strikemap.space`: already empty.
- **Workers custom domains** for strikemap: none remaining on account.
- **DNS removed**: `origin.strikemap.space` (A → EC2), `tunnel.strikemap.space` (CNAME → cfargotunnel).
- **Zero Trust tunnels** API: no tunnels listed (tunnel DNS was orphaned).
- **EC2**: terminated `i-0318f904ceb69d724` (`strikemap-origin`, `54.251.237.209`); released EIP `eipalloc-07ea21f34575f202e` when possible.
- **Left in DNS**: registrar MX/TXT on apex (email / SPF / verification) — not StrikeMap app infra.

## Still manual if desired
- **Delete the Cloudflare zone** or domain at registrar.
- **Domain registration** at Namecheap/registrar.

Repo source code is unchanged; only live Cloudflare bindings were deleted.
