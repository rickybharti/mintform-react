# Coin stack and naming map

The isolated component uses explicit names so the DOM reads like the visual
stack. The order below is the conceptual paint order, from the 3D core outward.

```text
mintform                         layout box, internal variables, isolation boundary
├─ mintform__body                one rotating preserve-3d body
│  ├─ mintform__edge-shell       cylindrical sidewall container
│  │  └─ mintform__edge-slice × N outward-facing sidewall panels
│  ├─ mintform__face--front      front disk at +thickness/2
│  │  ├─ mintform__face-outer     outer material disk
│  │  ├─ mintform__face-rim       1px rim
│  │  ├─ mintform__face-inner-ring darkened inner ring
│  │  ├─ mintform__face-surface   interior disk
│  │  ├─ mintform__face-field     lower material fade
│  │  └─ mintform__logo           clipped SVG or custom React content
│  ├─ mintform__face-inner--front zero-height front depth marker
│  ├─ mintform__face--back        reverse disk at -thickness/2
│  └─ mintform__face-inner--back  zero-height rear depth marker
├─ mintform__shadow-track         animated ground-shadow transform/opacity
│  └─ mintform__shadow             one-pixel ellipse + glow
└─ mintform__hit-area              transparent keyboard/touch button
```

## Why each layer exists

### `mintform__body`

This is the only element that receives `rotateY`. Its custom properties carry
the derived lighting values used by descendants: face shade, edge shade, and
shadow offset. Keeping rotation here makes the two faces, the 120-slice edge,
and the rear closures move as one 3D object.

### `mintform__edge-shell` and `mintform__edge-slice`

The side is not a border or a pair of overlapping face-adjacent planes. It is a
closed cylinder mesh of narrow tangential panels. Each panel is positioned at
the polygon's apothem, rotates around the face's Z axis, and spans exactly one
coin thickness after its X rotation. Its own outward face carries the ridge
paint and uses `backface-visibility: hidden`, so the reverse wall never paints
through either cap. `bevelHeightRatio` controls each panel's tangential width;
the default provides the small overlap needed to keep the tessellation closed.
Each panel also receives a static, local lower-material strength derived from
its ring angle. The purple therefore moves with the physical ridge, rather
than being projected across it from a separate overlay.

### The two faces and closures

Each face is a clipped circle offset by half the thickness. Both disks remain
available at edge angles, matching the reference's visible backface behavior.
The two zero-height `face-inner` elements are structural depth markers from the
reference stack: they do not paint, but preserve the face ordering inside the
shared 3D body. The face's four appearance layers are independent so a
consumer can alter the outer edge, rim, inner ring, and interior without
rebuilding the geometry.

### `mintform__face-field` and lower-ridge material

The sGHO treatment is local material paint, never a separately transformed
screen-space field. Each cap gets the same local vertical fade, clipped by its
existing circular face. Its leaf-level `mix-blend-mode: color` preserves the
surface's luminance, including the inset bevel between the cap and outer rim.
Each ridge receives a derived strength based on whether its physical ring
position is near the token's bottom; its two background layers are combined
with `background-blend-mode: color` so ridge highlights and shadows remain
visible. These blend layers have no 3D descendants—the shared `mintform__body`
still owns the transform—so the field stays attached to its cap or ridge rather
than flattening the coin or leaking outside the mesh.

### Shadow and hit area

The shadow is outside the rotating body so it can squash, widen, and fade
independently. The hit area is a transparent native button above the visual
layers, preserving keyboard and touch interaction without making any visual
layer responsible for input.

## Animation data flow

```text
click
  → motion.target += spinDegrees
  → spring updates rotation/velocity
  → rotation/pitch produce a shared body transform
      ├─ body rotateX + rotateY
      ├─ faceShade / edgeShade color mixing
      ├─ shadow X offset / width
      └─ bounce phase → body Y / shadow scale / opacity
```

The animation loop mutates refs directly, so React does not re-render 120 edge
segments on every frame. `prefers-reduced-motion` freezes the spring and bounce
while keeping the coin visible and interactive.
