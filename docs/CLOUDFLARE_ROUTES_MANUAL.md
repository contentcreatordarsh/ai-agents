# Worker routing on strikemap.space

The API token can deploy Workers but **cannot** attach zone Worker routes (`No access to the specified resource`). Production uses **custom domains** instead (Wrangler creates DNS automatically).

| Worker | Hostname(s) | PR |
|--------|-------------|-----|
| **`strikemap-platform`** | `strikemap.space`, `www.strikemap.space` | #2 game + `/api/v1` + WebSockets |
| **`strikemap-gateway`** | `map.strikemap.space` | #1 Next map UI, `/api/geo`, votes, EC2 proxy paths |
| **`se-stand-deliver-secure`** | `tunnel.strikemap.space/secure*` (zone route — already attached) | #1 R2 flags + Access demo |

Redeploy:

```bash
cd strikemap-platform && npm run deploy -- --domain strikemap.space --domain www.strikemap.space
cd worker-strikemap && npx wrangler deploy --domain map.strikemap.space
cd worker && npx wrangler deploy
```

**Origin (EC2):** reachable via Cloudflare Tunnel on `tunnel.strikemap.space` and direct EIP `54.251.237.209`. Apex no longer uses an `A` record to EC2 (apex points at the platform Worker).

If you need **Workers Routes** on the zone instead of custom domains, grant the token **Account → Workers Scripts → Edit** and **Zone → Workers Routes → Edit**.
