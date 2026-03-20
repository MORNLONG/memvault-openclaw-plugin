#!/usr/bin/env bash
# openclaw-memvault setup script
# Automatically configures:
# - tools.alsoAllow so the model can see memvault_* tools
# - plugins.allow so OpenClaw explicitly trusts this non-bundled plugin
#
# Usage:
#   bash setup.sh          — auto-detect config location
#   bash setup.sh /path/to/openclaw.json — explicit config path

set -euo pipefail

PLUGIN_ID="openclaw-memvault"

# --- locate config file ---
if [[ -n "${1:-}" ]]; then
  CONFIG_FILE="$1"
elif command -v openclaw &>/dev/null; then
  # Try `openclaw config path` if available
  CONFIG_FILE="$(openclaw config path 2>/dev/null || echo "")"
fi

if [[ -z "${CONFIG_FILE:-}" ]]; then
  # Fallback to common locations
  for candidate in \
    "./openclaw.json" \
    "$HOME/.openclaw/openclaw.json" \
    "/root/.openclaw/openclaw.json"; do
    if [[ -f "$candidate" ]]; then
      CONFIG_FILE="$candidate"
      break
    fi
  done
fi

if [[ -z "${CONFIG_FILE:-}" ]] || [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Cannot find openclaw.json. Please specify the path:"
  echo "   bash setup.sh /path/to/openclaw.json"
  exit 1
fi

echo "📄 Config: $CONFIG_FILE"

# --- check if already configured ---
if command -v jq &>/dev/null; then
  TOOLS_EXISTING=$(jq -r '.tools.alsoAllow // [] | .[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  PLUGINS_EXISTING=$(jq -r '.plugins.allow // [] | .[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  if echo "$TOOLS_EXISTING" | grep -qx "$PLUGIN_ID" && echo "$PLUGINS_EXISTING" | grep -qx "$PLUGIN_ID"; then
    echo "✅ tools.alsoAllow 和 plugins.allow 都已包含 \"$PLUGIN_ID\" — no changes needed."
    exit 0
  fi
fi

# --- apply by patching the JSON directly ---
if command -v python3 &>/dev/null; then
  python3 - "$CONFIG_FILE" "$PLUGIN_ID" <<'PY'
import json
import pathlib
import sys

config_path = pathlib.Path(sys.argv[1])
plugin_id = sys.argv[2]

with config_path.open("r", encoding="utf-8") as f:
    config = json.load(f)

tools = config.setdefault("tools", {})
also_allow = tools.setdefault("alsoAllow", [])
if plugin_id not in also_allow:
    also_allow.append(plugin_id)

plugins = config.setdefault("plugins", {})
plugin_allow = plugins.setdefault("allow", [])
if plugin_id not in plugin_allow:
    plugin_allow.append(plugin_id)

with config_path.open("w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY
  echo "✅ Done. Added \"$PLUGIN_ID\" to tools.alsoAllow and plugins.allow in $CONFIG_FILE."
  echo "   Restart Gateway to apply: openclaw gateway restart"
  exit 0
fi

# --- fallback: patch JSON with jq ---
if command -v jq &>/dev/null; then
  TEMP_FILE=$(mktemp)
  jq --arg id "$PLUGIN_ID" '
    .tools //= {} |
    .tools.alsoAllow //= [] |
    if (.tools.alsoAllow | index($id)) then .
    else .tools.alsoAllow += [$id]
    end |
    .plugins //= {} |
    .plugins.allow //= [] |
    if (.plugins.allow | index($id)) then .
    else .plugins.allow += [$id]
    end
  ' "$CONFIG_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$CONFIG_FILE"
  echo "✅ Done. Added \"$PLUGIN_ID\" to tools.alsoAllow and plugins.allow in $CONFIG_FILE."
  echo "   Restart Gateway to apply: openclaw gateway restart"
  exit 0
fi

echo "❌ Neither 'python3' nor 'jq' found. Please add manually:"
echo ""
echo '  "tools": {'
echo '    "alsoAllow": ["openclaw-memvault"]'
echo '  }'
echo '  "plugins": {'
echo '    "allow": ["openclaw-memvault"]'
echo '  }'
echo ""
echo "to your openclaw.json file."
exit 1
