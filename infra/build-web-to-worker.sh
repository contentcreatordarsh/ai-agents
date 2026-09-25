#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/web"
npm install
npm run build
rm -rf "$ROOT/worker-strikemap/public/"*
cp -r out/* "$ROOT/worker-strikemap/public/"
echo "Copied Next static export to worker-strikemap/public/"
cd "$ROOT/worker-strikemap"
npm install
npx wrangler deploy
echo "Deployed strikemap-gateway. Add routes strikemap.space/* in dashboard if needed."
