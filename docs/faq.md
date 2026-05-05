# MemVault OpenClaw Plugin FAQ

## What is MemVault?

MemVault is a cloud-backed long-term memory layer for AI Agents. This
repository contains the OpenClaw plugin.

## Do I need an account before installing?

No. The Free tier starts automatically after install. Link an account later
with `{/mvstatus}` if you want cross-device continuity or more capacity.

## How do I verify the plugin is working?

Install the plugin, restart the OpenClaw gateway, then run:

```text
{/mvstatus}
```

You should see the current plan, usage, and account connection state.

## What does the setup script change?

`scripts/setup.sh` updates OpenClaw's `plugins.allow` and `tools.alsoAllow`
configuration so the plugin and explicit MemVault tools are available.

## What can MemVault remember?

Typical useful memories are project paths, ports, config details, deployment
notes, and decisions that an agent may need to recall later.

## What tools does the plugin expose?

- `memvault_search`
- `memvault_store`
- `memvault_forget`
- `{/mvstatus}`

Automatic recall and capture are enabled by default.

## What are the current limits?

The Free tier includes 3 MB storage and 500 queries per day. Higher tiers are
listed on the pricing page.

## ClawHub shows "Legacy ZIP" under Artifact — is it safe to use?

Yes. The plugin install command is still the same and the plugin should work
normally.

ClawHub's "Legacy ZIP" label refers to the artifact format shown on the
listing page for this release. It does not change how you install or use the
plugin.

On the same page, ClawHub's security checks (for example ClawScan and static
analysis) show a benign result for this release.

If you hit any install/runtime issues, try installing from npm instead:

```text
openclaw plugins install @mornlong/openclaw-memvault
```

## Are global payments available?

The pricing page shows USD plans, but global payments are currently marked as
temporarily unavailable. Mainland China payments use WeChat Pay or Alipay.

## Where should I report installation problems?

Open a GitHub issue and include:

- OpenClaw version
- Node.js version
- install command output
- `{/mvstatus}` output if available
- relevant plugin logs, with secrets removed

Issue tracker: <https://github.com/MORNLONG/memvault-openclaw-plugin/issues>

## Where should I ask questions or share feedback?

Use GitHub Discussions for questions, setup help, and quick “worked / didn’t
work” verification feedback:

Discussions: <https://github.com/MORNLONG/memvault-openclaw-plugin/discussions>
