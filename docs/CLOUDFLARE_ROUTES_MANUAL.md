# Worker routes (one-time dashboard step)

Wrangler uploaded the scripts but API route attachment failed (`No access to the specified resource`). Add routes in the dashboard:

**Workers & Pages** → each worker → **Settings** → **Triggers** → **Routes**:

| Worker | Route |
|--------|--------|
| `se-stand-deliver-secure` | `tunnel.strikemap.space/secure*` |
| `strikemap-geo-edge` | `strikemap.space/api/geo` |

Then redeploy is optional; routes take effect immediately.
