# Cloudflare Solutions Engineer — Stand & Deliver

Implementation repo for the Cloudflare SE technical assignment: origin header echo, Cloudflare proxy/TLS, rate limiting, Tunnel, Zero Trust Access, and a Worker with private R2 flag assets.

## Quick start (local)

```bash
cd origin
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
curl -H "X-Test: 1" http://127.0.0.1:8080/
```

## Full deployment

See **[docs/SETUP.md](docs/SETUP.md)** for step-by-step dashboard and infrastructure instructions.

## Components

| Path | Purpose |
|------|---------|
| `origin/` | Flask app — returns all request headers in the response body |
| `worker/` | Wrangler Worker — `/secure` HTML + `/secure/{CC}` flags from R2 |
| `cloudflared/` | Example tunnel ingress config |
| `scripts/` | Optional origin firewall helper (Cloudflare IP allowlist) |
| `docs/PRESENTATION_OUTLINE.md` | Slide deck outline for the panel |

## Worker

```bash
cd worker
npm install
# Edit wrangler.toml (account_id, PUBLIC_HOST)
npx wrangler deploy
```

## What you must do outside this repo

1. Add your domain to Cloudflare and update nameservers at your registrar.
2. Provision a host, TLS certificate, and Cloudflare dashboard settings (DNS, SSL, WAF rate limit, Tunnel, Access, routes).
3. Push this repository to a **public** Git remote for the assignment deliverable.
4. Build slides from `docs/PRESENTATION_OUTLINE.md` and submit to your recruiter.
