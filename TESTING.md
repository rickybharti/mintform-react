# Testing Mintform

## Automated gate

| Command | Protects |
| --- | --- |
| `npm run check:style` | Consistent TypeScript, CSS, package, and script style. |
| `npm run check` | Strict TypeScript component and demo types. |
| `npm test` | Geometry/material property tests. |
| `npm run test:package` | Expected npm tarball files only. |
| `npm run test:consumer` | A clean React/Vite install of the packed tarball. |
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

## Performance harness

Run `npm run build:demo`, serve `dist-demo`, then open `/performance.html`.
Test one high-detail hero token before measuring multi-token cohorts. A single
high-detail token should be judged primarily by frame pacing; larger grids may
choose `detail="medium"`.
