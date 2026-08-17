# Mintform

A tactile, customizable CSS 3D token component for React. Mintform keeps its
cap, sidewall, ridge, lower-field, and animation geometry internal while
exposing a compact art-direction API.

> Status: MIT-licensed. The stable API begins at `0.1.0`.

## Install

Install Mintform with whichever npm-compatible package manager your React
project already uses:

| npm | pnpm | Yarn | Bun |
| --- | --- | --- | --- |
| `npm install @rickybharti/mintform` | `pnpm add @rickybharti/mintform` | `yarn add @rickybharti/mintform` | `bun add @rickybharti/mintform` |

```tsx
import { Mintform } from "@rickybharti/mintform";
import "@rickybharti/mintform/styles.css";

export function Token() {
  return (
    <Mintform
      appearance="sculpted"
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
`color-mix()`, blend modes, Pointer Events, `requestAnimationFrame`, and
`IntersectionObserver`; it is not a server-rendered, React Native, Vue, Svelte,
or framework-agnostic component today.

The component does not add runtime dependencies. React owns rendering; the
browser compositor handles transform animation. Mintform schedules JavaScript
frames only while a spin, tilt, drag, or flick is changing; the autonomous idle
bounce is a CSS animation on its own transform track.

## Browser support

Mintform targets modern evergreen desktop and mobile browsers with CSS 3D,
`color-mix()`, `mix-blend-mode`, Pointer Events, `requestAnimationFrame`, and
`IntersectionObserver`. In particular, it needs the CSS Color 4 features that
MDN lists as broadly available since May 2023; it has no legacy fallback for
those paint features. Test your own supported browser matrix before shipping a
branded token into production.

## API at a glance

- `preset` selects the GHO, sGHO (GHO plus lower colour field), or Aave
  reference material.
- `appearance` selects the layered `"sculpted"` cap (default) or a single
  plain `"clean"` cap without changing the sealed 3D geometry.
- `material.color` derives the cap, rim, highlights, primary ridge, and shadow.
- `lighting` selects the moving shade recipe: `"reference"`, `"studio"`, or
  `"dramatic"`.
- `lowerField` paints a second material into both caps and the physical ridge
  mesh—never as a background layer.
- `size`, `thickness`, and `detail` are safe geometry controls.
- `mark` accepts presets, nothing, or custom React/SVG content.
- `orientation`, `motion`, and `interaction` control presentation, spin, and
  optional drag/flick behaviour.
- `ref` exposes `spin()` and `reset()` for deliberate imperative control.

Read [API.md](./API.md) for the full contract and [STACK.md](./STACK.md) for
the 3D layer model. Both are included in the published tarball.

## Material and lighting

Mintform separates a token's **material**, its moving **shade**, and its lower
colour field:

- With no `material` prop, `preset` supplies an authored reference palette.
- With `material={{ color }}`, Mintform derives a coherent cap, rim, highlight,
  shadow, and ridge palette from that one colour. The ground shadow follows the
  base material unless a lower field is enabled. Hex colours use a tuned HSL
  recipe; other valid CSS colours use `color-mix()`.
- As the token rotates or tilts, Mintform derives face and ridge shade from its
  orientation and updates the existing CSS material tokens. `lighting` chooses
  the recipe: `"reference"` follows the reference token's angle-based shade,
  while `"studio"` and `"dramatic"` add progressively stronger directional
  shading. These are CSS paint recipes, not physical lights or render passes.
- `lowerField` is its own supplied colour. It blends into each physical cap and
  ridge while preserving their local highlight and shadow detail.

For most tokens, one base colour plus a lighting preset is the intended API:

```tsx
<Mintform
  material={{ color: "#31df4d" }}
  lighting="studio"
  lowerField={{ color: "#9184ff", reach: 0.52, softness: 0.3 }}
/>
```

The clean treatment uses the same material, lower field, marks, thickness,
shadow, and motion API. Its default edge is `"smooth"`, while an explicit edge
finish always wins:

```tsx
<Mintform
  appearance="clean"
  material={{ color: "#31df4d" }}
  lowerField={{ color: "#9184ff", reach: 0.52, softness: 0.3 }}
  mark={{ kind: "preset", name: "gho" }}
/>
```

### Art-directed materials

`rendering` is the opt-in expert layer for a brand with a specific visual
system. `rendering.material.tokens` replaces any derived token; sculpted face
and ridge gradients can also be replaced individually. Use the
`--mintform-material-*` variables inside a custom gradient when it should keep
responding to the token's live shade.

```tsx
<Mintform
  material={{ color: "#ff6a3d" }}
  lighting="dramatic"
  rendering={{
    material: {
      tokens: {
        faceHighlight: "#ffd2bd",
        faceShadow: "#8d2419",
        edgeAccent: "#c8442d",
      },
    },
    face: {
      gradients: {
        surface:
          "linear-gradient(var(--mintform-material-highlight), var(--mintform-material-base), var(--mintform-material-depth-highlight))",
      },
    },
  }}
/>
```

The resolved face palette starts with either the preset or the derived material
palette, then applies `rendering.material.tokens`. `edge.accentColor` remains
the focused shortcut for the alternating ridge colour. See [API.md](./API.md)
for every available token and gradient slot.

## Development

```bash
npm ci
npm run dev          # interactive playground
npm run build:demo   # production playground and benchmark
npm run test:all     # typecheck, property tests, build, package inspection
npm run test:release # plus the package-manager matrix and ESM/CJS audits
```

`npm run test:package` inspects `npm pack --dry-run` and permits only the
explicit distribution files. `npm run test:size` enforces gzip budgets for the
ES module, CommonJS module, and stylesheet. `npm run test:consumer` packs once,
then installs that exact immutable tarball with npm, pnpm, Yarn 4 Plug'n'Play,
and Bun's isolated linker. Every manager builds fresh React 18.2 and React 19
Vite consumers, type-checks NodeNext ESM/CommonJS imports, imports the CSS
subpath, and loads both JavaScript module formats. `npm run test:types`
additionally audits the packed ESM/CJS declaration boundary with publint and
attw. CI runs the package and type gate on Node 20 and 22, plus the complete
package-manager matrix on Node 22.

Running the complete consumer matrix locally requires npm, pnpm 10, Corepack
(which resolves the pinned Yarn 4.18 fixture), and Bun 1.3. CI provisions pnpm
10.34.5 and Bun 1.3.14 explicitly. These are release-test tools only; Mintform
still publishes one package to the npm registry and adds no runtime dependency.

## Publishing

Stable releases use npm's default `latest` tag. The publish action stays
separate from the release commit so the owner can confirm the exact package,
version, access, and provenance immediately before publication. See
[PUBLISHING-CHECKLIST.md](./PUBLISHING-CHECKLIST.md).

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md).

## License and marks

Mintform's source code is licensed under [MIT](./LICENSE). The `aave` and
`gho` reference marks remain trademarks of their respective owners; see
[NOTICE](./NOTICE). The package owner has confirmed the rights used for these
included reference presets. Downstream users must confirm their own rights
before distributing branded marks.
