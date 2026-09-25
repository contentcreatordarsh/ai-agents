# StrikeMap web (Next.js)

MapLibre-based live-intelligence demo UI for **strikemap.space**, exported as static HTML/JS and served from:

- **Cloudflare Worker** `strikemap-gateway` assets (~95% path when routes are attached)
- **EC2 origin** `origin/web_export/` (~5% / fallback when apex proxies to origin)

## Develop

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 — `/api/geo` only returns edge metadata when proxied through the Worker.

## Build and deploy

```bash
# Worker assets + wrangler deploy
../infra/build-web-to-worker.sh

# EC2 origin (includes latest static export)
../infra/deploy-origin-ec2.sh
```

Legacy callout trainer remains at **/trainer** on the origin.
