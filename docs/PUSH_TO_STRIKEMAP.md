# Push to https://github.com/contentcreatordarsh/strikemap

The Cloud Agent git token (`cursor[bot]`) can push to `AI-AGENTS` but needs **write access** to the new `strikemap` repo.

## Grant access (pick one)

1. **Cursor / Cloud Agent:** In Cursor settings, add **`contentcreatordarsh/strikemap`** to the GitHub repositories this agent can access, then ask the agent to push again.

2. **Push from your machine** (works immediately):

```bash
git clone -b cursor/se-stand-deliver-setup-8a1c https://github.com/contentcreatordarsh/ai-agents.git strikemap-push
cd strikemap-push
git remote remove origin
git remote add origin https://github.com/contentcreatordarsh/strikemap.git
git branch -M main
git push -u origin main
```

3. **GitHub CLI:**

```bash
gh repo clone contentcreatordarsh/ai-agents strikemap-push -- -b cursor/se-stand-deliver-setup-8a1c
cd strikemap-push
git remote set-url origin https://github.com/contentcreatordarsh/strikemap.git
git push -u origin HEAD:main
```

Expected `main` contents: StrikeMap origin, Workers, `docs/`, `infra/`, assignment scaffolding.
