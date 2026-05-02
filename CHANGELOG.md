# Changelog

All notable changes to `@mornlong/openclaw-memvault` are documented here.

## [0.2.7] - 2026-05-02

### Changed

- Included the quickstart documentation in the npm package so package viewers
  and registry mirrors can resolve the README quickstart link.
- Changed the plugin manifest API URL label and help copy to English for
  better default presentation in international OpenClaw plugin surfaces.
- Added ClawHub package compatibility and build metadata so registry validation
  can identify the runtime entrypoint and supported OpenClaw range.

## [0.2.6] - 2026-04-01

### Changed

- Switched the npm release pipeline to GitHub Actions trusted publishing with
  OIDC, removing the repository-side long-lived npm publish token dependency.
- Standardized the public package release process around GitHub Release +
  npm trusted publishing verification.

## [0.2.5] - 2026-03-29

### Added

- Added a Chinese README alongside the primary English README for the public repository.

### Changed

- Expanded first-run session migration to cover `active`, `reset`, and
  `deleted` OpenClaw session archives instead of only active `.jsonl` files.
- Updated migration logging and README copy to reflect the broader archive
  coverage.
- Updated the public plugin documentation to match the current install-first,
  link-later flow, current migration behavior, and current Portal billing model.

## [0.2.4] - 2026-03-20

### Changed

- Moved first-run migration parsing, chunking, deduplication, and event
  assembly out of the public OpenClaw plugin and into the private MemVault API.
- Simplified the public plugin into a thinner client: it now collects local
  memory/session files and uploads raw sources for server-side processing.

## [0.2.3] - 2026-03-20

### Changed

- Reworked the public repository presentation into a standalone product repo:
  formal README, branded logo asset, website-first metadata, and clearer
  package keywords for discovery.
- Clarified the repository as the single public source of truth for the
  OpenClaw plugin while the main MemVault server stack remains private.

## [0.2.2] - 2026-03-20

### Added

- Added a dedicated CI workflow for push and pull-request validation:
  `npm ci`, `npm run build`, `npm test`, `npm pack --dry-run`, and
  `npm audit --omit=dev`.
- Added `CONTRIBUTING.md` and `SECURITY.md` so the standalone repository is
  ready for outside contributors and security disclosures.

### Changed

- Corrected the standalone repository `LICENSE` copyright holder to
  `MORNLONG`.
- Updated deploy script comments and repository metadata to reflect the
  standalone GitHub repository workflow.

## [0.2.1] - 2026-03-20

### Changed

- Switched SDK imports from the rejected monolithic `openclaw/plugin-sdk` root
  to the focused `openclaw/plugin-sdk/memory-core` subpath required by the
  official plugin docs.
- Moved the npm publish workflow to the repository root so GitHub Actions can
  actually execute trusted publishing with `id-token: write`.
- Added publish metadata for npm and OpenClaw discovery:
  `repository`, `homepage`, `bugs`, `keywords`, `engines`, `publishConfig`,
  and `openclaw.install`.
- Added `.npmignore` and a lockfile-backed dependency layout for reproducible
  CI builds with `npm ci`.
- Refreshed README defaults and package docs to match the current product flow
  and current runtime defaults.

## [0.2.0] - 2026-03-19

### Added

- Hidden device-based identity model for install-first usage.
- `{/mvstatus}` command for plan, usage, and account connection state.
- Device connection code flow for linking an OpenClaw installation to a
  MemVault account without exposing internal IDs.
- Free-tier quota notices and read-only behavior when write limits are reached.
- Event-level memory provenance including timestamps, device identity, and
  source metadata.
- Automatic first-start migration for:
  - `MEMORY.md`
  - `memory/*.md`
  - OpenClaw session transcripts available on disk at install time

### Changed

- Reworked recall to use `before_prompt_build`, shorter timeouts, and stricter
  noise filtering so MemVault recall does not block normal OpenClaw replies.
- Changed migration and ingest to event-based upserts so the same source event
  is idempotent, while repeated content at different times remains preserved as
  distinct memory events.
- Updated account linking so new devices can join the same primary memory space
  after login, instead of creating separate long-term memory histories.

## [0.1.0] - 2026-03-08

### Added

- Initial OpenClaw MemVault plugin release.
- Three agent tools:
  - `memvault_store`
  - `memvault_search`
  - `memvault_forget`
- Automatic recall and capture hooks for long-term memory.
- Basic setup script for adding the plugin to `plugins.allow` and
  `tools.alsoAllow`.
