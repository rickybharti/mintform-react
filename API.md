# Mintform API

`Mintform` is the only root component export. Import the component and its
required stylesheet together:

```tsx
import { Mintform } from "@rickybharti/mintform";
import "@rickybharti/mintform/styles.css";
```

## Core props

| Prop | Contract |
| --- | --- |
| `preset` | `"gho"` (default), `"sgho"`, or `"aave"`. Supplies the authored default palette and mark; `sgho` also enables its lower colour field by default. Passing `material` replaces the cap palette but retains the preset's other defaults. |
| `appearance` | `"sculpted"` (default) renders the existing outer disk, rim, inner ring, and inset surface. `"clean"` renders one plain material cap per side. Both use the same sealed sidewall, marks, lower field, lighting, shadow, and motion system. |
| `size` | Diameter in CSS pixels. Defaults to `160`, clamps to `48`–`1024`. |
| `thickness` | Physical cap-to-cap depth. Defaults to 10% of `size`, clamps to 4%–25% of `size`. |
| `detail` | Adaptive sidewall density: `"low"`, `"medium"`, or `"high"` (default). At the 160px reference size these resolve to 48, 80, and 120 panels. Density scales with `size` and clamps to 24–240 panels so larger tokens stay round without unbounded DOM growth. |
| `material` | `{ color }`. One valid CSS colour derives the cap, rim, highlight, shadow, primary ridge, and alternating ridge palette. The ground shadow follows this material unless a lower field is enabled. Hex colours receive a tuned HSL palette; other valid CSS colours use local `color-mix()` derivation. `rendering.material.tokens` can replace any derived token. |
| `lowerField` | `false`, or `{ color, reach?, softness? }`. It tints the physical lower caps and ridge mesh. `reach` clamps to 0.05–1 (default 0.5); `softness` clamps to 0.01–`reach` (default 0.3). Pass `false` to remove the sGHO field. |
| `edge` | `{ accentColor?, accentEvery?, finish? }`. `accentEvery` is `2`, `3`, `4`, or `false`; `finish` is `"reeded"`, `"uniform"`, or `"smooth"`. Sculpted defaults to reeded and clean defaults to smooth. `reeded` permits alternating bands, `uniform` keeps one colour with per-panel highlight, and `smooth` removes both. An explicit finish always wins. This changes sidewall paint only, never geometry. |
| `shadow` | `false`, or `{ intensity?, color? }`. Intensity clamps to 0–1; the default colour follows the lower field when enabled, otherwise the cap material. |
| `lighting` | `"reference"` (default), `"studio"`, or `"dramatic"`. Mintform derives live face/ridge shade from the token's rotation and pitch. `reference` uses the reference angle-based recipe; `studio` and `dramatic` add increasingly strong directional shading. These are paint recipes, not additional render passes or physical lights. |

## Material and lighting model

The static material and moving shade are intentionally separate:

1. `preset` provides an authored GHO, sGHO, or Aave palette when `material` is
   omitted.
2. `material.color` derives the full base palette when supplied.
3. Rotation and pitch produce live face and ridge shade values, which CSS
   `color-mix()` applies to the resolved palette.
4. `lighting` selects the shade recipe; it does not replace the palette.
5. `lowerField` adds a second supplied colour to the physical lower caps and
   ridge mesh without replacing their lighting detail.

For exact brand art direction, the face palette resolves as:

```text
preset palette or material.color derivation
  -> rendering.material.tokens
```

`edge.accentColor` remains the focused override for alternating ridges, and
`rendering.edge.baseColor` is the focused override for the primary ridge.

In sculpted mode, `rendering.face.gradients` may replace the `outer`, `rim`,
`innerRing`, or `surface` gradients. Build a custom gradient from
`--mintform-material-*` variables when it should retain live shading; a
literal-colour gradient is an intentional fixed-paint override. Clean mode has
no bevel layers, so those face-only overrides are intentionally ignored.

## Marks and faces

`mark` supplies the default for both physical caps. `faces` may override either
side independently:

```tsx
<Mintform
  mark={{ kind: "preset", name: "gho", scale: 1 }}
  faces={{ back: { mark: { kind: "preset", name: "aave" } } }}
/>
```

`MintformMark` accepts:

- `{ kind: "preset", name: "gho" | "aave", scale?, color? }`
- `{ kind: "none" }`
- `{ kind: "custom", render, scale?, color?, clipRadius? }`

`scale` clamps to 0.5–1.25. Custom `clipRadius` clamps to 20–78. `render` may
be React/SVG content or a function that receives `{ side, id }`; use its unique
`id` prefix for SVG paint, mask, and clip-path IDs so front and back marks never
collide.

## Custom marks

```tsx
<Mintform
  material={{ color: "#ff6a3d" }}
  mark={{
    kind: "custom",
    scale: 0.9,
    render: ({ side, id }) => (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <title>{`${id}-${side}`}</title>
        <path d="M40 80h80" stroke="currentColor" strokeWidth="14" />
      </svg>
    ),
  }}
/>
```

### Custom marks in Next.js

The package entry is a Next.js Client Component boundary. Serializable values
such as presets, colours, geometry, and motion settings may be passed directly
from an App Router Server Component. A custom `render` function, `onSpin`, or
event handler must be created inside a file with `"use client"` because React
cannot serialize functions across the server-to-client boundary.

## Presentation, input, and motion

| Prop | Contract |
| --- | --- |
| `orientation` | `{ pitch? }`: a fixed X-axis tilt, clamped to −45°–45°. It does not change the vertical Y-axis spin. |
| `motion` | `{ initialRotation?, pitchArc?, spinOnPress?, direction?, turns?, idle?, profile? }`. `pitchArc` is the temporary extra X tilt for the midpoint of a press spin and clamps to −30°–30°. Direction is `"clockwise"`, `"counterclockwise"`, or `"alternate"`; turns are 1–3. Idle is `"bounce"` by default or `"none"`; profile is `"calm"`, `"reference"` (default), `"brisk"`, `"toss"`, or `"showcase"`. |
| `interactive` | Defaults to `true`. When enabled, Mintform renders a native, labelled spin button. Set `false` to omit the button and press spin; `motion.spinOnPress` then also defaults to `false`. Pair it with `motion.idle: "none"` for a fully static presentational coin. |
| `interaction` | `{ drag?: true }` opts into direct manipulation. Horizontal drag controls yaw, vertical drag controls tilt, and release can add bounded flick momentum. |
| `ariaLabel` | Accessible label for the built-in spin button; defaults to `"Spin token"`. `buttonProps["aria-label"]` takes precedence. |
| `onSpin` | Called when Mintform begins a press or imperative spin. |
| `className` / `style` | Applied to the outer non-interactive wrapper. Internal `--mintform-*` custom properties in `style` are intentionally ignored. |
| `rootProps` / `buttonProps` | Standard attributes for the wrapper or built-in button, including `data-*` hooks. Mintform retains its internal children, class, style, and button `type`. A disabled `buttonProps` disables click and drag interaction. |

Users who prefer no motion can combine `interactive={false}` with
`motion={{ idle: "none", spinOnPress: false }}` and a chosen
`orientation`/`initialRotation`.

## Imperative handle

```tsx
const token = useRef<MintformHandle>(null);

token.current?.spin({ direction: "clockwise", turns: 2 });
token.current?.reset();
```

`forwardRef` keeps React 18 support. Consumers on React 19 may still use the
same ref API. `spin()` accepts the same optional `direction` and `turns`
overrides as `motion`; `reset()` returns to the declared `initialRotation` and
fixed orientation.

## Advanced rendering

`rendering` is deliberately expert-only. It allows exact material tokens,
face gradients/insets, safe ridge density/width, shadow paint, and spring
configuration:

- `rendering.material.tokens`: any subset of `faceBase`, `faceMid`,
  `faceShadow`, `faceHighlight`, `faceDepthHighlight`, `edgeBase`,
  `edgeAccent`, and `mark`.
- `rendering.face`: `rimInset`, `innerRingInset`, `surfaceInset`, and a subset
  of `outer`, `rim`, `innerRing`, and `surface` CSS gradients.
- `rendering.edge`: `segments` (an exact 24–240 override for the adaptive
  `detail` resolver), `panelWidthRatio` (safe overlap range), and `baseColor`.
- `rendering.shadow`: `bottom`, `blur`, and `spread`.
- `rendering.motion`: `spinDegrees`, spring stiffness/damping, and bounce
  height/timing.

It cannot independently move the caps or sidewall: sealed geometry, paint
ordering, and per-frame transform ownership remain internal invariants.

Idle bounce is a compositor-friendly CSS transform on a wrapper track. The
interruptible spring loop owns only rotation, pitch, orientation shade, and
angle-dependent shadow width; it stops requesting frames at rest. Under
`prefers-reduced-motion: reduce`, idle motion is removed and press spins resolve
without interpolated movement.

For the complete TypeScript source of truth, import `MintformProps` from the
package root.
