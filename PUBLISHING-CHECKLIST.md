# Publishing checklist

This is the release checklist for `@rickybharti/mintform`. It separates what is
already enforced in this repository from decisions the owner must make before
publishing.

## Package contract

- [x] Scoped, lowercase package identity with `name` and semver `version`.
- [x] ESM and CommonJS entry points each select their matching generated
  declaration format; the explicit CSS export includes side-effect-only type
  markers.
- [x] React and React DOM are peer dependencies and externalized from the
  library bundle.
- [x] `files` limits the tarball; package inspection rejects unexpected `dist`
  artifacts.
- [x] One immutable packed tarball is installed and TypeScript-checked in clean
  React/Vite consumers using npm, pnpm, Yarn 4 PnP, and Bun's isolated linker.
- [x] Every package manager builds React 18.2 and React 19 consumers with
  NodeNext in both ESM and CommonJS modes, then loads both root module formats
  at runtime.
- [x] `publint` and `attw` audit the packed Node package boundary in the
  release gate; the browser-only CSS asset is verified through the Vite
  consumer instead.
- [x] `@rickybharti/mintform@0.1.0-rc.0` is public on the npm registry and the
  prerelease channel is documented explicitly.
- [x] Stable `0.1.0` metadata publishes publicly with npm's default `latest`
  tag.

## API and compatibility

- [x] `Mintform` is the only root export and CSS has a stable subpath export.
- [x] React 18.2+ and React 19 peer ranges are declared.
- [x] Document the supported browser floor: modern evergreen browsers with CSS
  3D, CSS Color 4 `color-mix()`, blend modes, Pointer Events, and
  `IntersectionObserver` (CSS `color-mix()` has cross-browser availability
  since May 2023).
- [ ] Capture deterministic visual regression frames at 0°, 45°, 90°, 135°,
  and 180° for no field, lower field, custom material, and custom mark cases.
- [ ] Test the agreed browser floor and one mid-tier mobile device.

## Legal and brand review

- [x] MIT license selected and included in the tarball.
- [x] Package owner confirmed rights for the bundled Aave and GHO reference
  marks; [NOTICE](./NOTICE) clarifies that their trademarks are not licensed by
  the MIT grant.
- [x] Add a copyright and trademark notice in the tarball.

## Supply chain and CI

- [x] CI runs `npm ci` and the release gate on Node 20 and 22.
- [x] CI enforces ESM, CommonJS, and CSS gzip budgets and runs the four-manager
  consumer matrix against one tarball.
- [x] A tag-triggered `publish.yml` reruns the complete release gate and uses
  npm trusted publishing without a stored write token.
- [x] Protect `main`: require Node 20, Node 22, and the four-package-manager
  check with strict up-to-date validation, and reject force pushes/deletion.
  Reviews remain optional for the owner's direct-main flow.
- [x] npm two-factor authentication is enabled for authorization and writes.
- [x] Configure npm trusted publishing with GitHub Actions after the release
  repository and package visibility are final.
- [x] If public provenance is desired, make both the repository and package
  public; npm does not generate provenance for private repositories.
- [x] Configure trusted publishing before the stable `0.1.0` release.

## Prerelease history

- [x] Review `CHANGELOG.md` and select `0.1.0-rc.0` as the public prerelease.
- [x] Run an isolated `npm ci`, `npm run test:release`, and `npm pack --dry-run`
  for the candidate.
- [x] Inspect one generated tarball and install it in blank React 18.2 and 19
  consumers with npm, pnpm, Yarn PnP, and Bun.
- [x] Set `private: false` and `publishConfig` to public `next` in the reviewed
  prerelease commit.
- [x] Publish `0.1.0-rc.0` publicly, confirm the package page, and keep the
  prerelease install command explicit until the stable release.

## Stable 0.1.0

- [x] Set the package version to `0.1.0` and remove the prerelease-only `next`
  publish tag.
- [x] Document bare npm, pnpm, Yarn, and Bun install commands for the stable
  channel.
- [x] Run `npm run test:release` against the exact `0.1.0` tarball.
- [x] Make the repository public so the stable package can carry provenance.
- [x] Connect `publish.yml` as the npm trusted publisher for the package.
- [x] Confirm the release commit passes every required GitHub Actions check.
- [x] Tag the reviewed release commit as `v0.1.0`.
- [x] Publish `@rickybharti/mintform@0.1.0` publicly and confirm npm's `latest`
  tag resolves to it.

## Why these checks exist

npm requires a package name and version, supports controlled tarball contents
with `files`, and treats scoped packages as private by default. Vite recommends
externalizing framework dependencies in library mode and exporting the bundled
CSS file. TypeScript recommends shipping generated declarations with generated
types. npm recommends trusted publishers/OIDC and 2FA for package publishing.

Sources: [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json),
[npm scopes](https://docs.npmjs.com/about-scopes/),
[Vite library mode](https://vite.dev/guide/build.html#library-mode),
[TypeScript declaration publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html),
and [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/).
