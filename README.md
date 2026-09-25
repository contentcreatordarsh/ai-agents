# StrikeMap — real-world multiplayer + tactical edge stack

**Tagline:** *Your city. Your battlefield.*

| Component | Path | Description |
|-----------|------|-------------|
| **Game platform (primary)** | [`strikemap-platform/`](strikemap-platform/) | Cloudflare Workers, D1, Durable Objects, WebSockets, v1 API — **City Battle** MVP |
| Map UI (Next.js) | [`web/`](web/) | Static map / demo feed (edge + EC2 export) |
| SE assignment / origin | [`origin/`](origin/), [`worker-strikemap/`](worker-strikemap/) | EC2 Flask origin, gateway Worker, tunnel, `/secure` |

**Live:** https://strikemap.space (game) · https://map.strikemap.space (intel map) · https://tunnel.strikemap.space/secure

### Run the game platform locally

```bash
cd strikemap-platform
npm install
npm run db:migrate:local
npm run dev
# http://localhost:8787 — landing, /demo, /api/v1/*
```

**Push target repo:** https://github.com/contentcreatordarsh/strikemap — see [docs/PUSH_TO_STRIKEMAP.md](docs/PUSH_TO_STRIKEMAP.md) (agent needs repo write access).

## Quick start (local)

```bash
cd origin
pip install -r requirements.txt
python app.py
open http://127.0.0.1:8080
```

## Deploy origin to EC2

```bash
./infra/deploy-origin-ec2.sh
```

## Workers

```bash
cd worker && npm install && npx wrangler deploy      # Live Ops /secure + R2
cd worker-geo && npm install && npx wrangler deploy # /api/geo edge
```

See **[docs/CLOUDFLARE_ROUTES_MANUAL.md](docs/CLOUDFLARE_ROUTES_MANUAL.md)** if routes fail via API.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/STRIKEMAP_DEMO.md](docs/STRIKEMAP_DEMO.md) | Panel demo script |
| [docs/SETUP.md](docs/SETUP.md) | Full assignment checklist |
| [docs/STRIKEMAP_STATUS.md](docs/STRIKEMAP_STATUS.md) | Infra status |

## What you must do outside this repo

1. Add your domain to Cloudflare and update nameservers at your registrar.
2. Provision a host, TLS certificate, and Cloudflare dashboard settings (DNS, SSL, WAF rate limit, Tunnel, Access, routes).
3. Push this repository to a **public** Git remote for the assignment deliverable.
4. Build slides from `docs/PRESENTATION_OUTLINE.md` and submit to your recruiter.
