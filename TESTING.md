# Testing Mintform

## Automated gate

| Command | Protects |
| --- | --- |
| `npm run check:style` | Consistent TypeScript, CSS, package, and script style. |
| `npm run check` | Strict TypeScript component and demo types. |
| `npm test` | Geometry/material property tests. |
| `npm run test:package` | Expected npm tarball files only. |
| `npm run test:consumer` | Clean React 18.2 and React 19 NodeNext/Vite installs of the packed tarball. |
| `npm run test:types` | Published ESM/CJS declarations and package exports with publint and attw. |
| `npm run test:release` | The complete package release gate. |

## Visual matrix

Exercise each state at 0°, 45°, 90°, 135°, and 180° yaw, including midway
through a press spin and while using an X-axis pitch arc.

- GHO-style material with no lower field.
- Lower field enabled and disabled.
- 48, 80, and 120 ridge panels.
- Minimum and maximum safe size/thickness combinations.
- Front/back custom marks and SVG gradient IDs.
- Reduced motion, keyboard activation, focus ring, drag/flick, and offscreen
  pause/resume.

`npm run test:consumer` deliberately tests the declared React peer floor
(18.2.0) rather than only the development React version. It type-checks ESM and
CommonJS imports with NodeNext resolution, imports the CSS subpath through a
real Vite consumer, and loads both root module formats at runtime. Its fixture
includes every public prop group, custom back-mark render context, wrapper and
button attributes, plus all expert rendering groups.

`npm run test:types` excludes only `./styles.css` from attw because it is a
browser bundler asset, not a Node-loadable JavaScript entry point. Its paired
ESM/CJS CSS type markers and the installed Vite consumer above cover that
subpath; attw audits the Node package boundary itself.

## Performance harness

Run `npm run build:demo`, serve `dist-demo`, then open `/performance.html`.
Test one high-detail hero token before measuring multi-token cohorts. A single
high-detail token should be judged primarily by frame pacing; larger grids may
choose `detail="medium"`.
