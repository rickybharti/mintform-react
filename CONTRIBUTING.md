# Contributing to Mintform

## Before changing rendering

Mintform is a CSS 3D component: a small DOM or transform change can expose a
cap/sidewall seam at an edge angle. Keep geometry, material paint, and motion
changes isolated; do not rely solely on a front-facing screenshot.

1. Install with `npm ci`.
2. Use `npm run dev` and test front, back, and edge-on positions.
3. Run `npm run check:style` and `npm run test:all`.
4. Run `npm run test:release` for package-boundary changes.
5. Record any new visual invariant in [TESTING.md](./TESTING.md).

The release gate expects npm, pnpm 10, Corepack, and Bun 1.3 to be available.
It packs Mintform once and builds that exact tarball in npm, pnpm, Yarn 4 PnP,
and Bun consumers. GitHub Actions provisions the pinned tool versions.

## Public API policy

Normal props express visual intent. Cap depth, panel radius, panel transforms,
paint ordering, and per-frame variables are internal invariants. Any public API
change needs documentation in [API.md](./API.md), a test, and a semver decision.

## Pull requests

Keep changes focused. Explain the visual or behavioural invariant being
protected, include the commands run, and note whether the public API or package
contents changed.
