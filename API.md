# Mintform API

## Everyday props

| Prop | Purpose |
| --- | --- |
| `size` | Diameter in pixels; minimum 48. |
| `thickness` | Physical cap-to-cap depth; clamped to 4%–25% of `size`. |
| `detail` | Ridge density: `low` (48), `medium` (80), or `high` (120). |
| `material` | One source colour from which the main material is derived. |
| `lowerField` | `false` or a bottom-attached `{ color, reach, softness }` material field. |
| `edge` | Alternate ridge colour, cadence, and `reeded`/`uniform` finish. |
| `mark` / `faces` | Preset, no mark, or custom React/SVG mark per cap. |
| `shadow` / `lighting` | Ground shadow strength and tested lighting recipes. |
| `orientation` | Fixed X-axis presentation tilt. |
| `motion` | Rest angle, spin direction/turns, profile, bounce, and bounded pitch arc. |
| `interaction` | Optional drag and flick manipulation. |
| `interactive` | Renders the accessible spin button when true. |

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

Use the supplied `id` prefix for SVG masks, gradients, and clip paths so the
front and back marks never collide.

## Imperative handle

```tsx
const token = useRef<MintformHandle>(null);

token.current?.spin({ direction: "clockwise", turns: 2 });
token.current?.reset();
```

`forwardRef` keeps React 18 support. Consumers on React 19 may still use the
same ref API.

## Advanced rendering

`rendering` is deliberately expert-only. It allows exact material tokens,
face gradients/insets, safe ridge density/width, shadow paint, and spring
configuration. It cannot independently move the caps or sidewall: sealed
geometry remains an invariant.

For the complete TypeScript source of truth, import `MintformProps` from the
package root.
