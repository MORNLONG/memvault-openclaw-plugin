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
