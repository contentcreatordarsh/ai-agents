# StrikeMap pull requests (stacked)

Open these in **[contentcreatordarsh/ai-agents](https://github.com/contentcreatordarsh/ai-agents)** (canonical development repo for this Cloud Agent):

| Order | PR | Base → Head | Scope |
|-------|-----|-------------|--------|
| 1 | [#3](https://github.com/contentcreatordarsh/ai-agents/pull/3) | `main` → `cursor/se-stand-deliver-setup-8a1c` | SE assignment scaffold: EC2 origin, tunnel, gateway/`/secure` Workers, `web/` map UI, infra scripts |
| 2 | [#4](https://github.com/contentcreatordarsh/ai-agents/pull/4) | `cursor/se-stand-deliver-setup-8a1c` → `cursor/strikemap-platform-mvp-8a1c` | **`strikemap-platform/`** — D1, Durable Objects, v1 API + WebSocket contracts, City Battle MVP |

**Merge order:** land PR #3 first, then rebase or merge PR #4 onto updated `main`.

## Mirror on `contentcreatordarsh/strikemap`

`main` on [strikemap](https://github.com/contentcreatordarsh/strikemap) currently matches the tip of `cursor/strikemap-platform-mvp-8a1c` (one-shot push). The Cloud Agent token cannot push feature branches there (HTTP 403).

To open the same two PRs on **strikemap**, from a machine with write access:

```bash
git remote add strikemap https://github.com/contentcreatordarsh/strikemap.git
git fetch origin cursor/se-stand-deliver-setup-8a1c cursor/strikemap-platform-mvp-8a1c
git push strikemap origin/cursor/se-stand-deliver-setup-8a1c:cursor/se-stand-deliver-setup-8a1c
git push strikemap origin/cursor/strikemap-platform-mvp-8a1c:cursor/strikemap-platform-mvp-8a1c

gh pr create --repo contentcreatordarsh/strikemap \
  --base main --head cursor/se-stand-deliver-setup-8a1c \
  --title "StrikeMap infra + SE scaffold" \
  --body "Stack base: origin, workers, web map UI, tunnel docs. See ai-agents PR #3."

gh pr create --repo contentcreatordarsh/strikemap \
  --base cursor/se-stand-deliver-setup-8a1c --head cursor/strikemap-platform-mvp-8a1c \
  --title "StrikeMap platform: Cloudflare-native City Battle MVP" \
  --body "Adds strikemap-platform/. See ai-agents PR #4."
```

If `main` already contains the platform tip, reset `main` to your pre-platform commit first, or use PR #2 with base `main` only for the delta after PR #1 merges.
