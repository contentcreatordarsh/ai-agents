# StrikeMap infrastructure status (Cloud Agent)

## Done automatically in this environment

| Item | Value |
|------|--------|
| AWS profile | `strikemap` (`ap-southeast-1`) |
| EC2 instance | `strikemap-origin` (`i-0318f904ceb69d724`) |
| Elastic IP | **54.251.237.209** |
| Origin app | Flask header echo on port 80 via nginx |
| Direct test | `curl -H "X-Test: 1" http://54.251.237.209/` |

## Blocked on one Cloudflare sign-in (same as AWS login)

DNS, SSL mode, rate limits, Tunnel, Access, Worker, and R2 require the **Cloudflare account that owns strikemap.space** to authorize this environment once (`wrangler login`).

After that, the agent can finish the rest without your laptop.

## DNS target (when Wrangler/API is authorized)

In Cloudflare for `strikemap.space`:

1. Remove legacy Google `A` / `AAAA` on `@`.
2. Add **A** `@` → `54.251.237.209` (**Proxied**).
3. **CNAME** `www` → `strikemap.space` (**Proxied**).

Then on EC2: `sudo certbot --nginx -d strikemap.space -d www.strikemap.space` (non-CF origin cert).
