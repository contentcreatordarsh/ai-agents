# Cloudflare agent setup (official)

Completed per [developers.cloudflare.com/agent-setup/prompt.md](https://developers.cloudflare.com/agent-setup/prompt.md):

- **Skills:** `npx -y skills add cloudflare/skills --skill '*' --yes --global` → installed under `~/.agents/skills/` and linked for Cursor (`~/.cursor/skills/` includes `cloudflare`, `wrangler`, `workers-best-practices`, etc.).
- **MCP:** Registered in `~/.cursor/mcp.json` (Cloud Agent) and `.cursor/mcp.json` (repo):
  - `cloudflare` → https://mcp.cloudflare.com/mcp
  - `cloudflare-docs` → https://docs.mcp.cloudflare.com/mcp
  - `cloudflare-bindings` → https://bindings.mcp.cloudflare.com/mcp
  - `cloudflare-builds` → https://builds.mcp.cloudflare.com/mcp
  - `cloudflare-observability` → https://observability.mcp.cloudflare.com/mcp

OAuth runs on first use of each protected server. **Restart the agent** (new Cloud Agent run) to load MCP config changes.

`aws-mcp` remains in `~/.cursor/mcp.json` with profile `strikemap`.
