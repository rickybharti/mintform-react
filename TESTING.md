# Testing Mintform

## Automated gate

| Command | Protects |
| --- | --- |
| `npm run check:style` | Consistent TypeScript, CSS, package, and script style. |
| `npm run check` | Strict TypeScript component and demo types. |
| `npm test` | Geometry/material property tests, appearance markup, and scoped frame-write invariants. |
| `npm run test:package` | Expected npm tarball files only. |
| `npm run test:size` | Gzip delivery budgets for ESM, CommonJS, and CSS output. |
| `npm run test:consumer` | One tarball installed and built with npm, pnpm, Yarn PnP, and Bun under React 18.2 and 19, then in a typed Next.js App and Pages Router production build. |
| `npm run test:types` | Published ESM/CJS declarations and package exports with publint and attw. |
| `npm run test:release` | The complete package release gate. |

## Visual matrix

Exercise each state at 0°, 45°, 90°, 135°, and 180° yaw, including midway
through a press spin and while using an X-axis pitch arc.

- Sculpted and clean caps, including explicit non-default edge finishes.
- GHO-style material with no lower field.
- Lower field enabled and disabled.
- Adaptive low/medium/high detail at small, reference, and large sizes, plus an
  explicit segment override.
- Minimum and maximum safe size/thickness combinations.
- Front/back custom marks and SVG gradient IDs.
- Reduced motion, keyboard activation, focus ring, drag/flick, and offscreen
  pause/resume.

`npm run test:consumer` deliberately tests the declared React peer floor
(18.2.0) rather than only the development React version. It creates one npm
tarball and verifies its SHA-512 digest after every consumer, so all eight
manager/React combinations exercise the same package bytes. Each fixture
type-checks ESM and CommonJS imports with NodeNext resolution, imports the CSS
subpath through a real Vite consumer, and loads both root module formats at
runtime. Yarn runs with Plug'n'Play and no `node_modules`; Bun uses its isolated
linker so undeclared or phantom dependencies fail visibly. The fixture includes
every public prop group, custom back-mark render context, wrapper and button
attributes, plus all expert rendering groups.

The Next.js fixture installs that same immutable tarball into a strict
TypeScript project covering both routers. Its App Router Server Component
directly imports Mintform with serializable props, while a separate
`"use client"` component supplies a custom SVG render function. A Pages Router
route imports Mintform normally. `next build` must statically prerender every
token, emit a client bundle, and carry the package stylesheet into the exported
CSS. The package inspection also fails if either JavaScript entry loses its
`"use client"` directive or if Next.js appears as a runtime/peer dependency.

`npm run test:types` excludes only `./styles.css` from attw because it is a
browser bundler asset, not a Node-loadable JavaScript entry point. Its paired
ESM/CJS CSS type markers and the installed Vite consumer above cover that
subpath; attw audits the Node package boundary itself.

## Performance harness

`npm run test:size` protects download and parse cost with deliberately small
gzip headroom. It complements rather than replaces browser profiling: package
bytes are deterministic in CI, while frame pacing depends on the host page,
browser, hardware, token count, and chosen detail.

Run `npm run build:demo`, serve `dist-demo`, then open `/performance.html`.
Test one high-detail hero token in both appearances before measuring multi-token
cohorts. A single high-detail token should be judged primarily by frame pacing;
larger grids may choose `detail="medium"`.
