# 95% Cloudflare Workers / 5% AWS EC2

StrikeMap uses a **gateway Worker** instead of Vercel for the public site on **strikemap.space**.

## Traffic split

| Tier | Share | Host | What runs there |
|------|-------|------|-----------------|
| **Cloudflare Workers** | ~95% | `strikemap.space`, `www` | Static atlas UI (`ASSETS`), `/api/*` (geo, maps, votes in **KV**), `/health/worker` |
| **AWS EC2** | ~5% | `54.251.237.209` | `/debug/headers` (assignment), `/ec2/*` proxy prefix, tunnel backend, optional ingest/cron |

## How routing works

1. DNS stays **proxied** (orange cloud) to your origin IP (or LB).
2. **Worker route** `strikemap.space/*` runs **first** at the edge.
3. Gateway code in `worker-strikemap/`:
   - Serves static files from **Workers Assets**
   - Handles APIs at the edge
   - **Proxies** only ` /debug/*` and `/ec2/*` to EC2 over HTTP with `Host: strikemap.space`

## Deploy gateway

```bash
cd worker-strikemap
npm install
npx wrangler deploy
```

If API route attach fails, add in dashboard: **Workers** → `strikemap-gateway` → Route `strikemap.space/*` and `www.strikemap.space/*`.

## Rate limiting

Target **POST** `https://strikemap.space/api/vote` in WAF (edge path).

## Tunnel + Live Ops

Unchanged: `tunnel.strikemap.space` → cloudflared → EC2; `/secure` Worker + Access + R2.

## strikemap.live (Next.js on Vercel)

The production app at **strikemap.live** is a separate **Next.js** codebase (not in the public GitHub repo). To move *that* app off Vercel:

- Use [**OpenNext for Cloudflare**](https://opennext.js.org/cloudflare) or **@cloudflare/next-on-pages**
- Keep **ingestion / cron / heavy jobs** on EC2 (~5%)
- Point `strikemap.live` Worker routes the same way as this gateway pattern

This repo implements the split for **strikemap.space** (assignment + tactical atlas).
