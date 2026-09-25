# strikemap-platform (game engine module)

TypeScript source for **City Battle**: Durable Object `StrikeGameDO`, `/api/v1` routes, D1 schema, and shared contracts.

**Production deploy:** the canonical Worker entry is **`worker-strikemap/`** (`strikemap-gateway`), which bundles this package. Do not run a second production Worker on the same hostnames.

## Local dev

```bash
npm install
npm run db:migrate:local
npm run dev   # Wrangler dev (standalone; prefer worker-strikemap for full stack)
npm test
```

See [docs/CITY_BATTLE.md](../docs/CITY_BATTLE.md).
