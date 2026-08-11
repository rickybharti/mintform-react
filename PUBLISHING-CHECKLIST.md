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
- [x] A packed tarball is installed and TypeScript-checked in a clean React/Vite
  consumer.
- [x] Packed React 18.2 and React 19 consumers type-check with NodeNext in both
  ESM and CommonJS modes, then load both root module formats at runtime.
- [x] `publint` and `attw` audit the packed Node package boundary in the
  release gate; the browser-only CSS asset is verified through the Vite
  consumer instead.
- [x] `@rickybharti/mintform` has no existing public registry release and the
  owner selected public distribution.

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
- [x] Protect `main`: require Node 20 and Node 22 checks and reject force
  pushes/deletion. Reviews remain optional for the owner's direct-main flow.
- [x] npm two-factor authentication is enabled for authorization and writes.
- [ ] Configure npm trusted publishing with GitHub Actions after the release
  repository and package visibility are final.
- [ ] If public provenance is desired, make both the repository and package
  public; npm does not generate provenance for private repositories.
- [ ] Configure trusted publishing before the stable `0.1.0` release. The
  reviewed prerelease may be published locally with 2FA after explicit owner
  confirmation.

## First release

- [x] Review `CHANGELOG.md` and select `0.1.0-rc.0` as the public prerelease.
- [x] Run an isolated `npm ci`, `npm run test:release`, and `npm pack --dry-run`
  for the candidate.
- [x] Inspect the generated tarball and install it in blank React 18.2 and 19
  consumers.
- [x] Set `private: false` and `publishConfig` to public `next` in the reviewed
  prerelease commit.
- [ ] Publish with the intended npm access level, tag the Git commit, and
  confirm the package page installs correctly.

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
