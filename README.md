<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/MORNLONG/memvault-openclaw-plugin/main/assets/memvault-logo.svg" alt="MemVault" width="560" />
</p>

<p align="center">
  Augmented Memory for AI Agents. Persistent memory and stronger recall across sessions and devices.
</p>

<p align="center">
  <a href="https://github.com/MORNLONG/memvault-openclaw-plugin/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/MORNLONG/memvault-openclaw-plugin/ci.yml?branch=main&label=CI&style=flat-square"></a>
  <a href="https://mv.mornlong.com/"><img alt="Website" src="https://img.shields.io/badge/website-mv.mornlong.com-ff7357?style=flat-square"></a>
  <img alt="OpenClaw Plugin" src="https://img.shields.io/badge/OpenClaw-plugin-241b16?style=flat-square">
  <img alt="Node 22+" src="https://img.shields.io/badge/node-22%2B-2d8b57?style=flat-square">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-5e5ce6?style=flat-square"></a>
</p>

## Overview

The MemVault plugin is OpenClaw's long-term memory layer. Context compression
is a critical weakness for AI Agents, and MemVault makes it easy to fix.

It gives OpenClaw a durable, cloud-backed memory space that survives:

- new conversations
- process restarts
- device changes
- account linking after first install

The current public repository is focused on the OpenClaw plugin only. OpenClaw
is the first production client, and more Agent clients will follow later.

## User Flow

MemVault is designed around a low-friction flow:

1. install the plugin
2. start using the free tier immediately
3. connect your account later with `{/mvstatus}` when you need it
4. keep the same memory space across devices

## What The Plugin Does

- Auto-recall before OpenClaw builds the next prompt
- Auto-capture after each agent run, preserving important content in full
- First-run migration for:
  - `MEMORY.md`
  - `memory/*.md`
  - OpenClaw session archives under `active`, `reset`, and `deleted`
- Cross-device continuity after account linking
- Explicit tools for search, store, and forget workflows
- Free-tier quota awareness with account-link and upgrade guidance

## Installation

Recommended install path:

```bash
openclaw plugins install @mornlong/openclaw-memvault
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

What happens after install:

- the plugin creates a device identity locally
- the free tier is available immediately
- account linking stays optional until you want cross-device continuity or more capacity
- `{/mvstatus}` shows plan, usage, and connection status

`scripts/setup.sh` adds the plugin to both `plugins.allow` and
`tools.alsoAllow`, so the explicit MemVault tools are visible to the model.

For a step-by-step verification flow, see
[MemVault Quickstart for OpenClaw](./docs/quickstart.md).

## Commands And Tools

### Slash command

- `{/mvstatus}`: show plan, usage, and current account connection state

### Agent tools

- `memvault_search`
- `memvault_store`
- `memvault_forget`

## Defaults

The plugin is optimized for install-first usage:

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

## Plans And Billing

Capacity tiers currently available to the plugin:

| Plan | Storage | Queries |
| --- | --- | --- |
| Free | 3 MB | 500 / day |
| Plus | 20 MB | 5,000 / day |
| Pro | 100 MB | 20,000 / day |
| Team | 2 GB | 100,000 / day |

Payment methods include:

- Mainland China: `CNY` with WeChat Pay or Alipay
- Global: `USD` with Stripe Checkout

Pricing and account management:

- Website: <https://mv.mornlong.com/>
- Pricing: <https://mv.mornlong.com/pricing>
- Account dashboard: <https://mv.mornlong.com/dashboard>

## Repository Layout

```text
.
├── src/                   # TypeScript source
├── dist/                  # Built plugin entrypoints for OpenClaw
├── tests/                 # Smoke tests
├── scripts/setup.sh       # Trust-list bootstrap helper
├── openclaw.plugin.json   # OpenClaw plugin manifest
└── .github/workflows/     # CI and publish workflows
```

`dist/` stays in the repository on purpose so local-path OpenClaw installs do
not depend on a TypeScript build step.

## Development

```bash
npm ci
npm run build
npm test
```

For contribution and release details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Links

- Website: <https://mv.mornlong.com/>
- Public product repo: <https://github.com/MORNLONG/memvault-openclaw-plugin>
- Issues: <https://github.com/MORNLONG/memvault-openclaw-plugin/issues>
- Quickstart: [docs/quickstart.md](./docs/quickstart.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security: [SECURITY.md](./SECURITY.md)

## License

MIT
