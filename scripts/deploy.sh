#!/usr/bin/env bash
# Deploy latest code from git to OpenClaw plugin directory
# Usage: ssh root@192.168.1.230 'bash /root/memvault-openclaw-plugin/scripts/deploy.sh'

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_SRC="$REPO_DIR"
PLUGIN_DST="/root/.openclaw/extensions/openclaw-memvault"

echo "[deploy] pulling latest code..."
cd "$REPO_DIR"
git pull --ff-only

echo "[deploy] syncing plugin files..."
# Preserve node_modules and hidden MemVault runtime state, replace everything else
find "$PLUGIN_DST" -mindepth 1 -maxdepth 1 \
	! -name node_modules \
	! -name '.memvault-*' \
	-exec rm -rf {} +
cp -r "$PLUGIN_SRC"/. "$PLUGIN_DST/"

# Ensure dependencies + build
cd "$PLUGIN_DST"
if [ ! -d node_modules ]; then
  echo "[deploy] installing dependencies..."
  npm install
else
  echo "[deploy] checking dependencies..."
  npm install --include=dev
fi

echo "[deploy] building TypeScript..."
npm run build

echo "[deploy] restarting gateway..."
openclaw gateway stop 2>/dev/null || true
sleep 2
openclaw gateway start

echo "[deploy] done."
