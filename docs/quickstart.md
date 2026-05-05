# MemVault Quickstart for OpenClaw

MemVault gives OpenClaw a cloud-backed long-term memory layer. Use this guide
to install the plugin and verify that memory is available.

## 1. Install

```bash
# Option A (ClawHub)
openclaw plugins install clawhub:@mornlong/openclaw-memvault

# Option B (npm)
openclaw plugins install @mornlong/openclaw-memvault

# Then (required once after either install option)
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

The setup script updates OpenClaw's allow lists so the MemVault tools are
visible to the model.

## 2. Check Status

In OpenClaw, run:

```text
{/mvstatus}
```

You should see the current plan, usage, and account connection state.

The Free tier starts automatically after install. Account linking is optional
until you want cross-device continuity or more capacity.

## 3. Try A Recall Scenario

Tell OpenClaw a small project detail that is useful later, for example:

```text
Remember that this project uses port 5173 for the local frontend dev server.
```

Continue working for a few turns, then ask:

```text
What port does this project use for the frontend dev server?
```

MemVault can help OpenClaw recall stored project details across sessions and
devices after account linking.

## Tools

The plugin provides:

- automatic recall before OpenClaw builds the next prompt
- automatic capture after agent runs
- `memvault_search`
- `memvault_store`
- `memvault_forget`
- `{/mvstatus}`

## Troubleshooting

- If `{/mvstatus}` is missing, re-run `scripts/setup.sh` and restart the gateway:

```bash
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

## Share (copy/paste)

If this helps, share a quick install + verification snippet:

```text
MemVault adds cloud long-term memory to OpenClaw.

openclaw plugins install clawhub:@mornlong/openclaw-memvault
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart

{/mvstatus}
```

## Useful Links

- Website: <https://mv.mornlong.com/>
- Pricing: <https://mv.mornlong.com/pricing>
- ClawHub: <https://clawhub.ai/plugins/%40mornlong%2Fopenclaw-memvault>
- Discussions (Q&A / feedback): <https://github.com/MORNLONG/memvault-openclaw-plugin/discussions>
- Issues: <https://github.com/MORNLONG/memvault-openclaw-plugin/issues>
