# Mintform stack and ownership map

Mintform has one sealed 3D geometry and two face treatments. Appearance changes
which cap paint is rendered, not how the coin is assembled or animated.

```text
mintform                              layout box and isolation boundary
├─ mintform__idle-track               CSS-only autonomous Y bounce
│  ├─ mintform__body                  interruptible rotateX/rotateY owner
│  │  ├─ mintform__edge-shell         one cylindrical sidewall mesh
│  │  │  └─ mintform__edge-slice × N  overlapping tangential panels
│  │  ├─ mintform__face--front        cap at +thickness/2
│  │  │  ├─ sculpted face layers OR one clean face layer
│  │  │  ├─ mintform__face-field      optional lower material
│  │  │  └─ mintform__logo            preset or custom mark
│  │  ├─ front/rear depth markers
│  │  └─ mintform__face--back         cap at -thickness/2
│  └─ mintform__hit-area               native button; follows idle bounce
└─ mintform__shadow-anchor             fixed ground position
   └─ mintform__shadow-angle-track     JS scaleX from coin orientation
      └─ mintform__shadow-idle-track   CSS scale/opacity idle response
         └─ mintform__shadow           one-pixel ellipse and glow
```

## Geometry is shared

The side is not a border or two planes placed over the faces. It is a closed
cylinder made from narrow tangential panels. Every panel spans the exact
cap-to-cap thickness, sits at the polygon apothem, overlaps its neighbours by a
small bounded amount, and hides its backface. The front and back caps sit at
positive and negative half-thickness inside the same `preserve-3d` body.

`detail` resolves a target panel width instead of a fixed count. At 160px the
three levels still produce the original 48, 80, and 120 panels. Larger tokens
receive more panels, smaller tokens receive fewer, and the final count is
bounded to 24–240. `rendering.edge.segments` bypasses that resolver for expert
art direction while retaining the same safety clamp.

## Appearance and edge are orthogonal

`appearance="sculpted"` renders the authored four-layer cap: outer disk, rim,
inner ring, and inset surface. `appearance="clean"` replaces those four paint
layers with one plain material disk. The lower field and mark are shared leaf
layers, so both treatments support the same colours, logos, front/back
overrides, lighting, and motion.

The sidewall never changes topology:

- `reeded` allows alternating ridge bands and keeps each panel's local
  highlight.
- `uniform` uses one ridge colour while retaining that local highlight.
- `smooth` uses one continuous material with no alternating bands or per-panel
  highlight.

Sculpted defaults to reeded; clean defaults to smooth. Passing an explicit
finish decouples those choices.

## Lower material stays attached

The lower colour field is local paint, not a separately transformed screen
overlay. Each cap gets the same vertical material fade inside its circular
clip. Each sidewall panel receives a static field strength from its physical
ring angle, so the lower colour follows the bottom of the coin through a full
turn. `mix-blend-mode: color` and `background-blend-mode: color` preserve local
luminance instead of covering the material with a matte plane.

## Motion has separate owners

Interruptible motion and autonomous motion have different requirements, so
they do not write the same `transform` property:

```text
press / drag / imperative spin
  → requestAnimationFrame spring while values are changing
  → body rotateX + rotateY
  → orientation-derived face/ridge shade
  → shadow-angle scaleX
  → frame loop stops at rest

idle="bounce"
  → CSS keyframes on idle-track
  → matching CSS keyframes on shadow-idle-track
  → browser can composite the loop without a permanent JS scheduler
```

React state is never updated per frame. Runtime writes go through refs, and the
only frame-varying geometric properties are transforms. The old shadow `width`
write is represented by `scaleX` on its own nested track. `will-change` is
enabled only while the interruptible runtime is active.

Live face shade and inset-shadow offset are written to the two cap elements,
while live edge shade is written to the edge shell. They are not placed on the
shared body, which avoids invalidating unrelated descendants through inherited
custom properties on every frame.

The component observes viewport and document visibility before scheduling the
JavaScript spring. CSS idle tracks pause when the component leaves the viewport.
Under `prefers-reduced-motion: reduce`, the decorative idle loop is removed and
press spins resolve directly to their final orientation.

## Source boundaries

```text
src/Mintform.tsx                 public composition, props, material resolution
src/core/appearance.ts          appearance defaults and adaptive edge density
src/core/geometry.ts            projection and physical lower-field math
src/core/material.ts            one-colour material palette derivation
src/core/motion.ts              pitch-arc and orientation-lighting math
src/runtime/useMintformMotion.ts interruptible scheduler and visibility policy
src/runtime/frame.ts            minimal direct DOM frame writes
src/MintformBase.css            sealed geometry and static material layers
src/Mintform.css                lower material, finishes, and CSS idle tracks
```

The public API selects intent. Core modules resolve that intent into bounded
geometry and paint choices. Runtime modules own changing values. CSS owns the
physical stack and the autonomous loop. This keeps future appearance recipes
from creating a second motion or geometry implementation.
