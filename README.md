<p align="center">
  <img src="https://raw.githubusercontent.com/MORNLONG/memvault-openclaw-plugin/main/assets/memvault-logo.svg" alt="MemVault" width="560" />
</p>

<p align="center">
  Long-term memory for OpenClaw. Install first, connect your account later.
</p>

<p align="center">
  <a href="https://github.com/MORNLONG/memvault-openclaw-plugin/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/MORNLONG/memvault-openclaw-plugin/ci.yml?branch=main&label=CI&style=flat-square"></a>
  <a href="https://mv.mornlong.com/"><img alt="Website" src="https://img.shields.io/badge/website-mv.mornlong.com-ff7357?style=flat-square"></a>
  <img alt="OpenClaw Plugin" src="https://img.shields.io/badge/OpenClaw-plugin-241b16?style=flat-square">
  <img alt="Node 22+" src="https://img.shields.io/badge/node-22%2B-2d8b57?style=flat-square">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-5e5ce6?style=flat-square"></a>
</p>

## Overview

MemVault is the **long-term memory layer for OpenClaw**.

It gives OpenClaw a durable memory space that survives:

- new conversations
- process restarts
- device changes
- account linking after first install

Instead of relying on a single local chat window, MemVault stores memory as a
cloud-backed timeline with:

- semantic recall for fuzzy memory lookup
- exact transcript retrieval for original wording
- event provenance with timestamps, device identity, and source metadata
- first-run migration from existing OpenClaw memory files and active sessions

OpenClaw is the first production integration. More Agent clients will follow,
but this repository is focused on the OpenClaw plugin only.

## Why It Exists

Most AI agents lose context in one of three ways:

- they compress long histories until details disappear
- they keep memory on one machine only
- they forget earlier transcripts when a session or device changes

MemVault is designed to fix that without forcing a heavy onboarding flow.

The intended user experience is:

1. install the plugin
2. use the free tier immediately
3. connect an email-backed account later with `{/mvstatus}` when needed
4. keep the same memory space across devices

## What The Plugin Does

- Auto-recall: injects relevant memory before the model responds
- Auto-capture: stores important turns after each conversation
- First-start migration:
  - `MEMORY.md`
  - `memory/*.md`
  - current valid OpenClaw session transcripts
- Cross-device continuity after account linking
- Explicit tools for search, store, and forget flows

## Installation

```bash
openclaw plugins install @mornlong/openclaw-memvault
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

Once installed:

- the plugin starts with a hidden device identity
- the free plan is available immediately
- no manual API key is required
- `{/mvstatus}` shows plan, usage, and connection status

## Commands And Tools

### Slash command

- `{/mvstatus}`: show current plan, usage, and account connection status

### Agent tools

- `memvault_search`
- `memvault_store`
- `memvault_forget`

These tools are available to the model after `scripts/setup.sh` adds the plugin
to both `plugins.allow` and `tools.alsoAllow`.

## Default Behavior

The plugin is optimized for low-friction use and sensible defaults:

| Option | Default | Purpose |
| --- | --- | --- |
| `apiUrl` | `https://api.mv.mornlong.com:8443` | MemVault API endpoint |
| `autoRecall` | `true` | Recall memory before replies |
| `autoCapture` | `true` | Capture important conversation turns |
| `maxRecallResults` | `5` | Maximum recalled memories per turn |
| `recallTimeoutMs` | `3500` | Skip recall if lookup becomes too slow |
| `scoreThreshold` | `0.4` | Minimum similarity score |
| `debug` | `false` | Verbose plugin logging |

Environment variable fallback:

| Variable | Maps to |
| --- | --- |
| `MEMVAULT_API_URL` | `apiUrl` |

## Plans

Current live plans:

| Plan | Price | Storage | Queries |
| --- | --- | --- | --- |
| Free | ¥0 | 3 MB | 500 / day |
| Plus | ¥9 / month | 20 MB | 5,000 / day |
| Pro | ¥29 / month | 100 MB | 20,000 / day |
| Team | ¥99 / month | 2 GB | 100,000 / day |

## Repository Layout

```text
.
├── src/                   # TypeScript source
├── dist/                  # Built plugin entrypoints for OpenClaw
├── tests/                 # Smoke tests
├── scripts/setup.sh       # Trust-list bootstrap helper
├── openclaw.plugin.json   # OpenClaw plugin manifest
└── .github/workflows/     # CI and trusted publish workflows
```

`dist/` is intentionally kept in the repository because OpenClaw local-path
installs should work without assuming a local TypeScript build step.

## Links

- Website: <https://mv.mornlong.com/>
- Product repo: <https://github.com/MORNLONG/memvault-openclaw-plugin>
- Issues: <https://github.com/MORNLONG/memvault-openclaw-plugin/issues>
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security: [SECURITY.md](./SECURITY.md)

## License

MIT
