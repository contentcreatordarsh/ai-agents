# StrikeMap — Tactical Atlas + Live Ops

Cloudflare SE assignment implementation on **strikemap.space**: tactical map trainer on **AWS EC2**, edge **Workers**, **Tunnel**, **Zero Trust** `/secure`, and private **R2** flags.

**Live:** https://strikemap.space · https://tunnel.strikemap.space · https://strikemap.space/debug/headers

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
