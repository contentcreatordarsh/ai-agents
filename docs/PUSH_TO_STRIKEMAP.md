# Push to https://github.com/contentcreatordarsh/strikemap

## Status

The Cloud Agent token (`cursor[bot]`) **cannot push** to `contentcreatordarsh/strikemap` (HTTP **403**). It **can** push to `contentcreatordarsh/ai-agents`.

**Canonical game + infra branch (push this to `strikemap` `main`):**

```text
https://github.com/contentcreatordarsh/ai-agents/tree/cursor/strikemap-platform-mvp-8a1c
```

Includes:

- **`strikemap-platform/`** — Cloudflare-native City Battle MVP (Workers, D1, Durable Objects, WebSockets, v1 API contracts)
- **`web/`** — Next.js map UI (static export for edge/origin)
- **`origin/`**, **`worker-strikemap/`**, **`worker/`**, **`infra/`**, **`docs/`**

## Fix access (pick one)

### 1. Grant Cursor / Cloud Agent write access (recommended)

In **Cursor** → GitHub integration → allow repository **`contentcreatordarsh/strikemap`**, then ask the agent to run:

```bash
git push strikemap cursor/strikemap-platform-mvp-8a1c:main
```

### 2. Push from your machine (works immediately)

```bash
git clone --branch cursor/strikemap-platform-mvp-8a1c \
  https://github.com/contentcreatordarsh/ai-agents.git strikemap-repo
cd strikemap-repo
git remote remove origin
git remote add origin https://github.com/contentcreatordarsh/strikemap.git
git push -u origin HEAD:main
```

### 3. Git bundle (no GitHub clone of ai-agents)

On a machine that already has the branch:

```bash
git bundle create strikemap-main.bundle cursor/strikemap-platform-mvp-8a1c
```

On your laptop:

```bash
git clone https://github.com/contentcreatordarsh/strikemap.git
cd strikemap
git pull /path/to/strikemap-main.bundle cursor/strikemap-platform-mvp-8a1c:main
git push origin main
```

## After push

1. `cd strikemap-platform && npm install`
2. `wrangler d1 create strikemap-db` → set `database_id` in `wrangler.jsonc`
3. `npm run db:migrate` (remote)
4. `npm run deploy`
5. Route **strikemap.space** to Worker `strikemap-platform`

See [strikemap-platform/README.md](../strikemap-platform/README.md) and [STRIKEMAP_PLATFORM.md](./STRIKEMAP_PLATFORM.md).
