# Publishing checklist

This is the release checklist for `@rickybharti/mintform`. It separates what is
already enforced in this repository from decisions the owner must make before
changing `private: true` or publishing.

## Package contract

- [x] Scoped, lowercase package identity with `name` and semver `version`.
- [x] ESM, CommonJS, bundled declarations, and explicit CSS export.
- [x] React and React DOM are peer dependencies and externalized from the
  library bundle.
- [x] `files` limits the tarball; package inspection rejects unexpected `dist`
  artifacts.
- [x] A packed tarball is installed and TypeScript-checked in a clean React/Vite
  consumer.
- [ ] Confirm that `@rickybharti/mintform` is available in the intended npm
  account and choose public or private distribution.

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
- [ ] Enable npm two-factor authentication for publishing and settings changes.
- [ ] Configure npm trusted publishing with GitHub Actions after the release
  repository and package visibility are final.
- [ ] If public provenance is desired, make both the repository and package
  public; npm does not generate provenance for private repositories.
- [ ] Keep publishing disabled locally; publish from reviewed CI only.

## First release

- [ ] Review `CHANGELOG.md` and choose the correct initial semver version.
- [ ] Run `npm ci`, `npm run test:release`, and `npm pack --dry-run` from a
  clean checkout.
- [ ] Inspect the generated tarball and install it in a blank consumer.
- [ ] Change `private` in the reviewed release commit only.
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
