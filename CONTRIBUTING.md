# Contributing

Thanks for contributing to `@mornlong/openclaw-memvault`.

## Local setup

```bash
npm ci
npm run build
npm test
```

## Project layout

- `src/`: TypeScript source
- `dist/`: built plugin files used by OpenClaw local-path installs
- `tests/`: smoke tests
- `scripts/setup.sh`: trust-list helper for OpenClaw config
- `scripts/deploy.sh`: git-based deployment helper for the test host

## Before opening a pull request

Run all validation locally:

```bash
npm ci
npm run build
npm test
npm pack --dry-run
npm audit --omit=dev
```

## Release policy

- Follow SemVer.
- Update `CHANGELOG.md` for user-visible changes.
- Release publishing is handled by GitHub Actions with npm trusted publishing.

## Release process

Use the standard workflow when a runtime or package-facing change should reach
npm users:

1. Update `package.json` and `openclaw.plugin.json` to the target version.
2. Update `CHANGELOG.md`.
3. Run the full local validation set:
   - `npm ci`
   - `npm run build`
   - `npm test`
   - `npm pack --dry-run`
   - `npm audit --omit=dev`
4. Merge the release-ready commit to `main`.
5. Create a GitHub Release tagged as `vX.Y.Z`.

That published GitHub Release triggers `.github/workflows/publish.yml`, which
publishes the package to npm through trusted publishing.

Notes:

- GitHub-only documentation updates do not require an npm publish.
- If you want the npm package page to show the latest README, that still
  requires publishing a new version.
