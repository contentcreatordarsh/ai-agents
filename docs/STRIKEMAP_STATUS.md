# StrikeMap infrastructure status (Cloud Agent)

## Done automatically in this environment

| Item | Value |
|------|--------|
| AWS profile | `strikemap` (`ap-southeast-1`) |
| EC2 instance | `strikemap-origin` (`i-0318f904ceb69d724`) |
| Elastic IP | **54.251.237.209** |
| Origin app | Flask header echo on port 80 via nginx |
| Direct test | `curl -H "X-Test: 1" http://54.251.237.209/` |

## Wrangler (done)

- Logged in as **darshan.p.hegde@gmail.com** (account `0fa4850c978886b80a15821863df3855`).
- Worker **`se-stand-deliver-secure`** deployed on route `tunnel.strikemap.space/secure*`.
- R2 bucket **`se-country-flags`** created; flag objects uploaded.
- Tunnel **`strikemap-origin`** (`f9337053-4b87-4a78-ab07-14721d10eb53`) ingress → `http://127.0.0.1:8080`; **cloudflared** running on EC2.

## Blocked: DNS API (Wrangler OAuth has no Zone DNS Edit)

Wrangler OAuth cannot create/edit DNS records (API returns auth error). Need **one** of:

1. **API token** (recommended): Cloudflare dashboard → Profile → API Tokens → **Edit zone DNS** for `strikemap.space` only → set as `CLOUDFLARE_API_TOKEN` in this agent (tell the agent the token once), **or**
2. **Manual DNS** (two records below) in the Cloudflare dashboard.

## DNS target (when Wrangler/API is authorized)

In Cloudflare for `strikemap.space`:

1. Remove legacy Google `A` / `AAAA` on `@`.
2. Add **A** `@` → `54.251.237.209` (**Proxied**).
3. **CNAME** `www` → `strikemap.space` (**Proxied**).

Then on EC2: `sudo certbot --nginx -d strikemap.space -d www.strikemap.space` (non-CF origin cert).
