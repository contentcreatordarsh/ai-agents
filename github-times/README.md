# The GitHub Times

A front-page newspaper dashboard for trending GitHub repositories.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4

## Features

- **Headline News** — top trending repo with structured editorial copy
- **Classifieds & Tech Briefs** — grid of six repos across language desks
- **Live data** — GitHub Search API with mock fallback on rate limits
- **Filters** — daily/weekly edition and language filter

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

Optional: set `GITHUB_TOKEN` for higher API rate limits.

## Production

```bash
npm run build
npm run start
```

Server binds to `0.0.0.0:3000` for Daytona port forwarding.

## Daytona (from repo root)

Snapshot naming: **`cursor-[project]-[version]`** → `cursor-github-times-v1`

```bash
cd ..
npm run snapshot:github-times   # create / refresh snapshot
npm run deploy:github-times     # deploy from snapshot (fast path)
```

Requires `DAYTONA_API_KEY` (+ `write:snapshots` to create snapshots). Optional `GITHUB_TOKEN` at deploy time (not baked into snapshot).
