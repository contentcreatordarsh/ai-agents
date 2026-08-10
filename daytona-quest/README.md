# Daytona Sandbox Quest

Gamified visualization of **real Daytona sandbox operations**, with missions mapped to concepts from [daytona.io/docs](https://www.daytona.io/docs/en/).

Cloned reference docs: `vendor/daytona-docs` ([daytonaio/docs](https://github.com/daytonaio/docs))

## Features

- XP, levels, and unlockable mission chain
- Live sandbox spawn per mission (create → execute → destroy)
- Mission feed + run history
- Neon game UI

## Missions

| Mission | Docs section | Sandbox op |
|---------|--------------|------------|
| Boot Camp | Getting Started | `echo` in new sandbox |
| Python Spark | Process & Code Execution | `code_run` Python |
| File Scout | File System | upload + read file |
| Velocity Run | Sandboxes | latency benchmark |
| Polyglot Pulse | TypeScript SDK | Python + Node chain |
| Clean Exit | Lifecycle | graceful teardown |

## Run locally

```bash
npm install
# DAYTONA_API_KEY in .env.local
npm run dev
```

Open http://localhost:3001

## Deploy to Daytona

From repo root:

```bash
npm run deploy:daytona-quest
```
