# Changelog

All notable changes to Mintform will be documented in this file.

## Unreleased

## 0.1.0 — first stable release

- Added `appearance="clean"` as a plain-cap treatment on the existing sealed
  3D geometry; the sculpted renderer remains the default.
- Added the `"smooth"` sidewall finish and appearance-aware edge defaults.
- Made `detail` density adaptive to token size with a bounded 24–240 panel
  range; explicit `rendering.edge.segments` remains authoritative.
- Moved autonomous idle bounce and shadow bounce to CSS transform tracks. The
  JavaScript frame loop now stops at rest and no longer changes shadow width or
  body translation during idle motion.
- Added gzip delivery budgets and a one-tarball consumer matrix across npm,
  pnpm, Yarn 4 Plug'n'Play, and Bun for both React 18.2 and React 19.

## 0.1.0-rc.0 — public prerelease candidate

- Initial standalone React component repository.
- ESM, CommonJS, matching generated TypeScript declarations, stable CSS export,
  and a strict package-content gate.
- Packed NodeNext ESM/CJS consumer verification for React 18.2 and React 19,
  package declaration audits, a performance harness, and a release checklist.
- MIT licensing and a bundled trademark notice for the included reference
  presets.
