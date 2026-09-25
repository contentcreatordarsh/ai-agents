#!/usr/bin/env bash
set -euo pipefail

HOST="${STRIKEMAP_EC2_HOST:-54.251.237.209}"
KEY="${STRIKEMAP_EC2_KEY:-$HOME/.ssh/strikemap-ec2-key.pem}"
REMOTE_DIR="/opt/strikemap/origin"

echo "Deploying origin to ubuntu@${HOST}..."

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$ROOT/web/out" ]; then
  rm -rf "$ROOT/origin/web_export"
  mkdir -p "$ROOT/origin/web_export"
  cp -a "$ROOT/web/out/." "$ROOT/origin/web_export/"
  echo "Bundled Next.js static export into origin/web_export/"
else
  echo "Note: $ROOT/web/out missing — run infra/build-web-to-worker.sh or cd web && npm run build"
fi

tar -C "$ROOT/origin" -czf /tmp/strikemap-origin.tgz .
scp -o StrictHostKeyChecking=no -i "${KEY}" /tmp/strikemap-origin.tgz "ubuntu@${HOST}:/tmp/"
ssh -o StrictHostKeyChecking=no -i "${KEY}" "ubuntu@${HOST}" \
  "mkdir -p ${REMOTE_DIR} && tar -xzf /tmp/strikemap-origin.tgz -C ${REMOTE_DIR}"

ssh -o StrictHostKeyChecking=no -i "${KEY}" "ubuntu@${HOST}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/strikemap
if [ ! -d venv ]; then python3 -m venv venv; fi
./venv/bin/pip install -q -r origin/requirements.txt
sudo systemctl restart strikemap-origin.service
sudo systemctl is-active strikemap-origin.service
REMOTE

echo "Deploy complete."
