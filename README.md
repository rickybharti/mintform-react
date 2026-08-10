# Mintform

A tactile, customizable CSS 3D token component for React. Mintform keeps its
cap, sidewall, ridge, lower-field, and animation geometry internal while
exposing a compact art-direction API.

> Status: private, tested, and not yet published to npm.

## Install

After publishing:

```bash
npm install @rickybharti/mintform
```

```tsx
import { Mintform } from "@rickybharti/mintform";
import "@rickybharti/mintform/styles.css";

export function Token() {
  return (
    <Mintform
      size={160}
      thickness={16}
      material={{ color: "#4dd93d" }}
      lowerField={{ color: "#978eff", reach: 0.5 }}
      edge={{ accentColor: "#43ad52", finish: "reeded" }}
      mark={{ kind: "preset", name: "gho" }}
      interaction={{ drag: true }}
      motion={{ pitchArc: 18, profile: "reference" }}
      ariaLabel="Spin token"
    />
  );
}
```

## Platform support

Mintform is a **React component for the browser**. It supports React 18.2+ and
React 19 as peer dependencies. Rendering and motion use DOM, CSS 3D transforms,
`color-mix()`, Pointer Events, `requestAnimationFrame`, and
`IntersectionObserver`; it is not a server-rendered, React Native, Vue, Svelte,
or framework-agnostic component today.

The component does not add runtime dependencies. React owns rendering; the
browser compositor handles transforms, shading, and CSS animation surfaces.

## API at a glance

- `material.color` derives the cap, rim, highlights, primary ridge, and shadow.
- `lowerField` paints a second material into both caps and the physical ridge
  mesh—never as a background layer.
- `size`, `thickness`, and `detail` are safe geometry controls.
- `mark` accepts presets, nothing, or custom React/SVG content.
- `orientation`, `motion`, and `interaction` control presentation, spin, and
  optional drag/flick behaviour.
- `ref` exposes `spin()` and `reset()` for deliberate imperative control.

Read [API.md](./API.md) for the full contract and [STACK.md](./STACK.md) for
the 3D layer model.

## Development

```bash
npm ci
npm run dev          # interactive playground
npm run build:demo   # production playground and benchmark
npm run test:all     # typecheck, property tests, build, package inspection
npm run test:release # plus a clean installed-package React/Vite consumer
```

`npm run test:package` inspects `npm pack --dry-run` and permits only the
explicit distribution files. CI runs the full release gate on Node 20 and 22.

## Publishing

The package stays `private: true` until its legal, compatibility, and release
requirements are approved. See [PUBLISHING-CHECKLIST.md](./PUBLISHING-CHECKLIST.md).

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md).
This repository is `UNLICENSED` until its owner selects a distribution license.
