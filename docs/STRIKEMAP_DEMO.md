# StrikeMap — panel demo script

## Public atlas (EC2 + Cloudflare)

1. Open **https://strikemap.space**
2. Click map callouts (Site Alpha), **Vote this strat**
3. Show **Live vote tally** updating

## Rate limiting demo

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://strikemap.space/api/vote \
    -H 'Content-Type: application/json' \
    -d '{"calloutId":"mid"}'
done
```

Cloudflare dashboard → **Security** → **Events** (filter rate limit / block).

Configure rule (if not already): **POST** `strikemap.space/api/vote`, 10 requests / 10 seconds per IP, block.

## Edge geo Worker

- **https://strikemap.space/api/geo** → `source: cloudflare-worker-edge` with `country` / `colo`
- UI header shows edge geo hint on the atlas page

## Assignment introspection

- **https://strikemap.space/debug/headers** — all request headers in body

## Tunnel

- **https://tunnel.strikemap.space/** — same origin via **cloudflared** (no public app port required narrative)

## Live Ops (Zero Trust + Worker + R2)

1. Incognito → **https://tunnel.strikemap.space/secure** → blocked / login
2. Authenticate (OTP or IdP); allow policy: your email + `*@cloudflare.com`
3. See identity HTML; click country code → flag SVG from **private R2**

## TLS

- Origin: Let's Encrypt on EC2
- Cloudflare: **Full (strict)**
