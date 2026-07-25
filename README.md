# AI Agents

TypeScript task agents with **[Daytona](https://www.daytona.io/)** sandboxes for safe execution. The first automation is a **monthly expense summary**: parse bank/card CSV exports in an isolated sandbox, then generate a narrative report with your configured LLM.

## Architecture

| Piece | Role |
|--------|------|
| **CLI (`src/cli.ts`)** | Runs tasks on your machine |
| **Daytona (cloud by default)** | Parses CSVs with Python in an isolated sandbox |
| **LLM (OpenAI-compatible or Anthropic)** | Writes the human-readable monthly summary |

When you iterate in **Cursor**, you can use **Composer 2.5** (or any model Cursor provides) to edit and extend this repo. The **runtime** CLI uses `LLM_PROVIDER` / `LLM_MODEL` and API keys from `.env` — Cursor models are not invoked automatically by this CLI.

## Prerequisites

1. [Daytona account](https://app.daytona.io) and [API key](https://app.daytona.io/dashboard/keys)
2. An LLM API key (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
3. Node.js 20+

## Setup

```bash
cp .env.example .env
# Edit .env with DAYTONA_API_KEY and OPENAI_API_KEY (or Anthropic)

npm install
```

## Monthly expense summary

1. Export transactions from your bank or card as **CSV** (or TSV) into a folder (default: `data/expenses/`).
2. Run:

```bash
npm run expense-summary -- --month 2026-06 --input data/expenses
```

3. Open the report under `reports/2026-06-expense-summary.md`.

A sample file is included: `data/expenses/sample-june-2026.csv`.

### Supported CSV columns

The analyzer recognizes common headers (case-insensitive), for example:

- **Date:** `Date`, `Transaction Date`, `Posted Date`
- **Amount:** `Amount`, `Debit`, `Credit`
- **Description:** `Description`, `Memo`, `Payee`
- **Category:** `Category`, `Type` (optional; defaults to `Uncategorized`)

Negative amounts are treated as spending; positive as income.

## Daytona: cloud vs self-hosted

| Mode | Configuration |
|------|----------------|
| **Cloud (default)** | `DAYTONA_MODE=cloud` and `DAYTONA_API_KEY` |
| **Self-hosted** | `DAYTONA_MODE=self-hosted`, `DAYTONA_API_URL`, and `DAYTONA_API_KEY` |

Optional: `DAYTONA_TARGET` for cloud region (e.g. `us`).

## LLM configuration

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `openai` (default) or `anthropic` |
| `LLM_MODEL` | Model id (default `gpt-4o-mini`) |
| `OPENAI_BASE_URL` | Optional; use any OpenAI-compatible API |

## Project layout

```
src/
  cli.ts                 # CLI entry
  config.ts              # Env + Daytona/LLM config
  daytona/client.ts      # Sandbox session helper
  llm/                   # Provider abstraction
  agents/task-agent.ts   # Simple LLM task runner
  tasks/expense-summary/ # First automation
data/expenses/           # Your CSV exports (gitignored except samples)
reports/                 # Generated markdown reports
```

## Adding more automations

1. Add `src/tasks/<name>/task.ts` with your workflow.
2. Register a subcommand in `src/cli.ts`.
3. Use `withSandbox()` for any shell, Python, or untrusted file processing.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run expense-summary -- --month YYYY-MM` | Monthly expense report |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | TypeScript check |

## Security notes

- Do not commit `.env` or real bank exports.
- Parsing runs in Daytona, not on shared production servers.
- Keep API keys only in your local `.env` or secret store.
