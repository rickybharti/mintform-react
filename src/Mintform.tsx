import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  clamp,
  finite,
  type ProjectedNormal,
  projectCoinNormal,
  ridgeFieldStrength,
} from "./core/geometry";
import "./MintformBase.css";
import "./Mintform.css";

export type CSSColor = string;
export type MintformPreset = "gho" | "sgho" | "aave";
export type MintformDetail = "low" | "medium" | "high";
export type MintformDirection = "clockwise" | "counterclockwise" | "alternate";
export type MintformMarkPreset = "gho" | "aave";

export type MintformMarkRenderContext = {
  /** The physical cap currently rendering the custom mark. */
  side: "front" | "back";
  /** A per-renderer ID prefix for SVG paint, mask, or clip-path IDs. */
  id: string;
};

export type MintformMaterial = {
  color: CSSColor;
};

export type MintformMaterialTokens = {
  faceBase: CSSColor;
  faceMid: CSSColor;
  faceShadow: CSSColor;
  faceHighlight: CSSColor;
  faceDepthHighlight: CSSColor;
  edgeBase: CSSColor;
  edgeAccent: CSSColor;
  mark: CSSColor;
};

export type MintformLowerField =
  | false
  | {
      color: CSSColor;
      reach?: number;
      softness?: number;
    };

export type MintformEdge = {
  accentColor?: CSSColor;
  accentEvery?: 2 | 3 | 4 | false;
  /** Keeps the same sealed ridge mesh, with or without alternating bands. */
  finish?: "reeded" | "uniform";
};

export type MintformMark =
  | { kind: "none" }
  | {
      kind: "preset";
      name: MintformMarkPreset;
      scale?: number;
      color?: CSSColor;
    }
  | {
      kind: "custom";
      render: ReactNode | ((context: MintformMarkRenderContext) => ReactNode);
      scale?: number;
      color?: CSSColor;
      clipRadius?: number;
    };

export type MintformShadow =
  | false
  | {
      intensity?: number;
      color?: CSSColor;
    };

export type MintformOrientation = {
  /**
   * A fixed camera-style tilt around the horizontal axis. Mintform keeps the
   * press spin on its vertical axis, so a tilted coin still has one
   * predictable spin direction.
   */
  pitch?: number;
};

export type MintformLighting = "reference" | "studio" | "dramatic";

export type MintformFaces = {
  front?: { mark?: MintformMark };
  back?: { mark?: MintformMark };
};

export type MintformInteraction = {
  /** Opt-in direct manipulation; tap/click still triggers the configured spin. */
  drag?: boolean;
};

export type MintformMotion = {
  initialRotation?: number;
  /**
   * Maximum additional X-axis tilt during a press spin. Positive and negative
   * values choose the tilt direction; the arc always returns to rest.
   */
  pitchArc?: number;
  spinOnPress?: boolean;
  direction?: MintformDirection;
  turns?: 1 | 2 | 3;
  idle?: "none" | "bounce";
  profile?: "calm" | "reference" | "brisk" | "toss" | "showcase";
};

export type MintformRendering = {
  material?: {
    tokens?: Partial<MintformMaterialTokens>;
  };
  face?: {
    rimInset?: number;
    innerRingInset?: number;
    surfaceInset?: number;
    gradients?: Partial<{
      outer: string;
      rim: string;
      innerRing: string;
      surface: string;
    }>;
  };
  edge?: {
    segments?: number;
    panelWidthRatio?: number;
    baseColor?: CSSColor;
  };
  shadow?: {
    bottom?: number;
    blur?: number;
    spread?: number;
  };
  motion?: {
    spinDegrees?: number;
    springStiffness?: number;
    springDamping?: number;
    bounceHeight?: number;
    bounceDurationMs?: number;
    bouncePhaseMs?: number;
  };
};

export type MintformSpinOptions = {
  direction?: MintformDirection;
  turns?: 1 | 2 | 3;
};

export type MintformHandle = {
  spin: (options?: MintformSpinOptions) => void;
  reset: () => void;
};

export type MintformRootProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "className" | "style"
>;

export type MintformButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "className" | "style" | "type"
>;

export type MintformProps = {
  preset?: MintformPreset;
  size?: number;
  thickness?: number;
  detail?: MintformDetail;
  material?: MintformMaterial;
  lowerField?: MintformLowerField;
  edge?: MintformEdge;
  mark?: MintformMark;
  faces?: MintformFaces;
  shadow?: MintformShadow;
  lighting?: MintformLighting;
  interaction?: MintformInteraction;
  orientation?: MintformOrientation;
  motion?: MintformMotion;
  interactive?: boolean;
  ariaLabel?: string;
  onSpin?: () => void;
  /** Standard DOM attributes for the non-interactive outer wrapper. */
  rootProps?: MintformRootProps;
  /** Standard button attributes; Mintform keeps the button's type and internals. */
  buttonProps?: MintformButtonProps;
  rendering?: MintformRendering;
  className?: string;
  style?: CSSProperties;
};

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

type MaterialTokens = Required<MintformMaterialTokens>;

type FaceRendering = {
  outerGradient: string;
  rimGradient: string;
  innerRingGradient: string;
  surfaceGradient: string;
  rimInset: number;
  innerRingInset: number;
  surfaceInset: number;
};

type ResolvedPalette = {
  faceBase: CSSColor;
  faceMid: CSSColor;
  faceShadow: CSSColor;
  faceHighlight: CSSColor;
  faceDepthHighlight: CSSColor;
  logo: CSSColor;
  edgePrimary: CSSColor;
  edgeAlternate: CSSColor;
};

type AnimationState = {
  rotation: number;
  target: number;
  velocity: number;
  tilt: number;
  tiltTarget: number;
  tiltVelocity: number;
  usesPitchArc: boolean;
  pitchOrigin: number;
  pitchTarget: number;
  pitchStartOffset: number;
};

type Frame = {
  y: number;
  rotation: number;
  pitch: number;
  shadowScale: number;
  shadowOpacity: number;
  shadowWidth: number;
  shadowX: number;
  faceShade: number;
  edgeShade: number;
};

type AppliedFrame = Frame | null;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startRotation: number;
  startTilt: number;
  lastX: number;
  lastTime: number;
  yawVelocity: number;
  moved: boolean;
};

// The lower field is material attached to the face and ridge surfaces. It is
// deliberately not a screen-space overlay: the 3D body moves the material,
// while the animation loop updates transforms and lighting only.

const REFERENCE_GHO: MaterialTokens = {
  faceBase: "color(display-p3 0.31 0.85 0.24)",
  faceMid: "color(display-p3 0.28 0.75 0.29)",
  faceShadow: "color(display-p3 0.22 0.61 0.22)",
  faceHighlight: "color(display-p3 0.42 0.98 0.78)",
  faceDepthHighlight: "color(display-p3 0.19 0.72 0.44)",
  edgeBase: "color(display-p3 0.31 0.85 0.24)",
  edgeAccent: "color(display-p3 0.28 0.75 0.29)",
  mark: "#ffffff",
};

const REFERENCE_AAVE: MaterialTokens = {
  faceBase: "color(display-p3 0.56 0.5 0.97)",
  faceMid: "color(display-p3 0.48 0.4 0.84)",
  faceShadow: "color(display-p3 0.33 0.26 0.78)",
  faceHighlight: "color(display-p3 0.83 0.75 0.98)",
  faceDepthHighlight: "color(display-p3 0.65 0.56 0.96)",
  edgeBase: "color(display-p3 0.56 0.5 0.97)",
  edgeAccent: "color(display-p3 0.48 0.4 0.84)",
  mark: "#ffffff",
};

const DEFAULT_FACE: FaceRendering = {
  outerGradient:
    "linear-gradient(-60deg, var(--mintform-material-shadow), var(--mintform-material-base), var(--mintform-material-highlight), var(--mintform-material-highlight), var(--mintform-material-base), var(--mintform-material-shadow))",
  rimGradient:
    "linear-gradient(60deg, var(--mintform-material-shadow), var(--mintform-material-base), var(--mintform-material-highlight), var(--mintform-material-highlight), var(--mintform-material-base), var(--mintform-material-shadow))",
  innerRingGradient:
    "linear-gradient(rgb(0 0 0 / 20%)), linear-gradient(60deg, var(--mintform-material-shadow), var(--mintform-material-base), var(--mintform-material-highlight), var(--mintform-material-highlight), var(--mintform-material-base), var(--mintform-material-shadow))",
  surfaceGradient:
    "linear-gradient(var(--mintform-material-highlight), var(--mintform-material-base), var(--mintform-material-depth-highlight))",
  rimInset: 1,
  innerRingInset: 16.5,
  surfaceInset: 18,
};

const DETAIL_SEGMENTS: Record<MintformDetail, number> = {
  low: 48,
  medium: 80,
  high: 120,
};

// A ridge panel must be at least as wide as its tangential spacing around the
// circumference. The small extra overlap prevents hairline seams at side view.
const MIN_PANEL_WIDTH_RATIO = Math.PI + 0.05;
const MAX_PANEL_WIDTH_RATIO = 4.8;
const DRAG_YAW_DEGREES_PER_PIXEL = 0.55;
const DRAG_TILT_DEGREES_PER_PIXEL = 0.28;
const DRAG_START_DISTANCE = 5;
const MAX_FLICK_DEGREES = 180;

const PROFILE_MOTION = {
  calm: {
    springStiffness: 11,
    bounceHeight: 14,
    bounceDurationMs: 3400,
  },
  reference: {
    springStiffness: 15,
    bounceHeight: 20,
    bounceDurationMs: 3000,
  },
  brisk: {
    springStiffness: 24,
    bounceHeight: 22,
    bounceDurationMs: 2200,
  },
  toss: {
    springStiffness: 19,
    bounceHeight: 28,
    bounceDurationMs: 2400,
  },
  showcase: {
    springStiffness: 9,
    bounceHeight: 12,
    bounceDurationMs: 3800,
  },
} as const;

const LIGHTING_PROFILES = {
  reference: null,
  studio: { x: -0.45, y: -0.25, z: 0.86, strength: 0.38 },
  dramatic: { x: -0.68, y: -0.4, z: 0.61, strength: 0.62 },
} as const;

function easeInOut(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pingPong(value: number) {
  const phase = ((value % 1) + 1) % 1;
  return phase < 0.5 ? easeInOut(phase * 2) : easeInOut((1 - phase) * 2);
}

function spinProgress(rotation: number, origin: number, target: number) {
  const distance = target - origin;
  if (Math.abs(distance) < 0.000001) return 1;
  return clamp((rotation - origin) / distance, 0, 1);
}

function pitchArcOffset(
  rotation: number,
  origin: number,
  target: number,
  startOffset: number,
  arc: number,
) {
  const progress = spinProgress(rotation, origin, target);
  return startOffset * (1 - progress) + arc * Math.sin(Math.PI * progress);
}

function shadingForNormal(normal: ProjectedNormal, lighting: MintformLighting) {
  const edgeOn = Math.hypot(normal.x, normal.y);
  const reference = {
    faceShade: edgeOn ** 2,
    edgeShade: normal.z ** 2,
  };
  const profile = LIGHTING_PROFILES[lighting];

  if (!profile) return reference;

  // The viewer-facing normal is deliberate: both physical faces retain the
  // readable, luminous token treatment while the X/Y light direction still
  // moves coherently as the coin turns and tilts.
  const directLight = clamp(
    normal.x * profile.x +
      normal.y * profile.y +
      Math.abs(normal.z) * profile.z,
    0,
    1,
  );
  const directionalShade = 1 - directLight;

  return {
    faceShade: clamp(
      reference.faceShade * (1 - profile.strength) +
        directionalShade * profile.strength,
      0,
      1,
    ),
    edgeShade: clamp(
      reference.edgeShade * (1 - profile.strength * 0.55) +
        directionalShade * profile.strength * 0.55,
      0,
      1,
    ),
  };
}

type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

function parseHexToHsl(color: string): HslColor | null {
  const normalized = color.trim().replace(/^#/, "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;

  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    if (maximum === green) hue = (blue - red) / delta + 2;
    if (maximum === blue) hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return { hue, saturation: saturation * 100, lightness: lightness * 100 };
}

function hsl({ hue, saturation, lightness }: HslColor) {
  return `hsl(${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

/**
 * Converts one intentional material colour into the coherent palette required
 * by the cap, rim, ridge, lighting, and shadow layers.
 */
export function deriveMaterialTokens(color: CSSColor): MaterialTokens {
  const base = parseHexToHsl(color);

  if (!base) {
    return {
      faceBase: color,
      faceMid: `color-mix(in oklab, ${color}, #000 16%)`,
      faceShadow: `color-mix(in oklab, ${color}, #000 34%)`,
      faceHighlight: `color-mix(in oklab, ${color}, #fff 28%)`,
      faceDepthHighlight: `color-mix(in oklab, ${color}, #000 12%)`,
      edgeBase: color,
      edgeAccent: `color-mix(in oklab, ${color}, #000 16%)`,
      mark: "#ffffff",
    };
  }

  const neutral = base.saturation < 8;
  const shade = (hue: number, saturation: number, lightness: number) =>
    hsl({
      hue: neutral ? 0 : hue,
      saturation: neutral ? 0 : clamp(saturation, 18, 92),
      lightness: clamp(lightness, 5, 94),
    });

  return {
    faceBase: color,
    faceMid: shade(base.hue + 3, base.saturation * 0.75, base.lightness - 3),
    faceShadow: shade(base.hue + 3, base.saturation * 0.7, base.lightness - 13),
    faceHighlight: shade(
      base.hue + 31,
      base.saturation + 17,
      base.lightness + 16,
    ),
    faceDepthHighlight: shade(
      base.hue + 30,
      base.saturation - 10,
      base.lightness - 9,
    ),
    edgeBase: color,
    edgeAccent: shade(base.hue + 3, base.saturation * 0.75, base.lightness - 3),
    mark: "#ffffff",
  };
}

function defaultMarkForPreset(preset: MintformPreset): MintformMark {
  return {
    kind: "preset",
    name: preset === "aave" ? "aave" : "gho",
  };
}

function sanitizeHostStyle(style: CSSProperties | undefined) {
  if (!style) return undefined;

  return Object.fromEntries(
    Object.entries(style).filter(([key]) => !key.startsWith("--mintform-")),
  ) as CSSProperties;
}

function GhoMark() {
  return (
    <>
      <path d="M80 26c-29 0-52 23-52 53s23 53 52 53c18 0 32-8 41-21l-1-1v21h13V84h-14c-3 19-18 33-39 33S41 100 41 79s17-39 39-39c19 0 34 13 37 31h14c-4-26-26-45-51-45Z" />
      <circle cx="66" cy="71" r="10.5" />
      <circle cx="94" cy="71" r="10.5" />
    </>
  );
}

function AaveMark() {
  return (
    <>
      <path d="M80 27c-29 0-53 24-53 53h14c0-22 17-39 39-39s39 17 39 39h14c0-29-24-53-53-53Z" />
      <circle cx="66" cy="71" r="10.5" />
      <circle cx="94" cy="71" r="10.5" />
    </>
  );
}

function Mark({
  mark,
  size,
  side,
}: {
  mark: MintformMark;
  size: number;
  side: "front" | "back";
}) {
  const markInstanceId = useId().replace(/:/g, "");
  if (mark.kind === "none") return null;

  const scale = clamp(finite(mark.scale, 1), 0.5, 1.25);
  const clipRadius =
    mark.kind === "custom"
      ? clamp(finite(mark.clipRadius, 61.5), 20, 78)
      : 61.5;
  const markStyle = {
    "--mintform-logo-transform": scale === 1 ? "none" : `scale(${scale})`,
    "--mintform-logo-clip-radius": `${(clipRadius * size) / 160}px`,
  } as CSSVars;

  if (mark.kind === "preset") {
    return (
      <svg
        className="mintform__logo"
        viewBox="0 0 160 160"
        fill="none"
        aria-hidden="true"
        style={markStyle}
      >
        {mark.name === "aave" ? <AaveMark /> : <GhoMark />}
      </svg>
    );
  }

  return (
    <div className="mintform__logo" aria-hidden="true" style={markStyle}>
      {typeof mark.render === "function"
        ? mark.render({
            side,
            id: `mintform-mark-${markInstanceId}`,
          })
        : mark.render}
    </div>
  );
}

function Face({
  side,
  mark,
  markColor,
  size,
  hasLowerField,
}: {
  side: "front" | "back";
  mark: MintformMark;
  markColor: CSSColor;
  size: number;
  hasLowerField: boolean;
}) {
  return (
    <div
      className={`mintform__face mintform__face--${side}`}
      style={{ "--mintform-logo-color": markColor } as CSSVars}
    >
      <div className="mintform__face-outer" />
      <div className="mintform__face-rim" />
      <div className="mintform__face-inner-ring" />
      <div className="mintform__face-surface" />
      {hasLowerField && (
        <div className="mintform__face-field" aria-hidden="true" />
      )}
      <Mark mark={mark} size={size} side={side} />
    </div>
  );
}

function markColorFor(mark: MintformMark, fallback: CSSColor) {
  return mark.kind === "none" ? fallback : (mark.color ?? fallback);
}

function applyFrame(
  elements: {
    body: HTMLDivElement | null;
    shadowTrack: HTMLDivElement | null;
    shadow: HTMLDivElement | null;
    hitArea: HTMLButtonElement | null;
  },
  frame: Frame,
  previous: AppliedFrame,
) {
  if (!elements.body) return previous;

  const y = `${frame.y}px`;
  if (
    previous === null ||
    previous.y !== frame.y ||
    previous.rotation !== frame.rotation ||
    previous.pitch !== frame.pitch
  ) {
    elements.body.style.transform = `translateY(${frame.y}px) rotateX(${frame.pitch}deg) rotateY(${frame.rotation}deg)`;
  }
  if (previous === null || previous.shadowX !== frame.shadowX) {
    elements.body.style.setProperty(
      "--mintform-shadow-x",
      `${frame.shadowX}px`,
    );
  }
  if (previous === null || previous.faceShade !== frame.faceShade) {
    elements.body.style.setProperty(
      "--mintform-face-shade",
      `${frame.faceShade}`,
    );
  }
  if (previous === null || previous.edgeShade !== frame.edgeShade) {
    elements.body.style.setProperty(
      "--mintform-edge-shade",
      `${frame.edgeShade}`,
    );
  }

  if (elements.hitArea && (previous === null || previous.y !== frame.y)) {
    elements.hitArea.style.transform = `translateY(${y})`;
  }

  if (elements.shadowTrack && elements.shadow) {
    if (previous === null || previous.shadowScale !== frame.shadowScale) {
      elements.shadowTrack.style.transform = `translateX(50%) scale(${frame.shadowScale})`;
    }
    if (previous === null || previous.shadowOpacity !== frame.shadowOpacity) {
      elements.shadowTrack.style.opacity = `${frame.shadowOpacity}`;
    }
    if (previous === null || previous.shadowWidth !== frame.shadowWidth) {
      elements.shadow.style.width = `${frame.shadowWidth}%`;
    }
  }

  return frame;
}

export const Mintform = forwardRef<MintformHandle, MintformProps>(
  function Mintform(
    {
      preset = "gho",
      size: requestedSize = 160,
      thickness: requestedThickness,
      detail = "high",
      material,
      lowerField,
      edge,
      mark,
      faces,
      shadow,
      lighting = "reference",
      interaction,
      orientation,
      motion,
      interactive = true,
      ariaLabel = "Spin token",
      onSpin,
      rootProps,
      buttonProps,
      rendering,
      className = "",
      style,
    },
    ref,
  ) {
    const size = clamp(finite(requestedSize, 160), 48, 1024);
    const sizeScale = size / 160;
    const thickness = clamp(
      finite(requestedThickness, size * 0.1),
      size * 0.04,
      size * 0.25,
    );
    const safeStyle = useMemo(() => sanitizeHostStyle(style), [style]);
    const {
      "aria-label": buttonAriaLabel,
      onClick: onButtonClick,
      onPointerDown: onButtonPointerDown,
      onPointerMove: onButtonPointerMove,
      onPointerUp: onButtonPointerUp,
      onPointerCancel: onButtonPointerCancel,
      ...restButtonProps
    } = buttonProps ?? {};
    const buttonDisabled = restButtonProps.disabled === true;
    const resolvedMark = mark ?? defaultMarkForPreset(preset);
    const frontMark = faces?.front?.mark ?? resolvedMark;
    const backMark = faces?.back?.mark ?? resolvedMark;
    const initialRotation = finite(motion?.initialRotation, 0);
    const pitch = clamp(finite(orientation?.pitch, 0), -45, 45);
    const dragEnabled =
      interactive && !buttonDisabled && interaction?.drag === true;
    const resolvedLighting: MintformLighting =
      lighting === "studio" || lighting === "dramatic" ? lighting : "reference";
    const initialRotationRef = useRef(initialRotation);
    const animationRef = useRef<AnimationState>({
      rotation: initialRotation,
      target: initialRotation,
      velocity: 0,
      tilt: pitch,
      tiltTarget: pitch,
      tiltVelocity: 0,
      usesPitchArc: false,
      pitchOrigin: initialRotation,
      pitchTarget: initialRotation,
      pitchStartOffset: 0,
    });
    const alternateDirectionRef = useRef(1);
    const reducedMotionRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const shadowTrackRef = useRef<HTMLDivElement>(null);
    const shadowRef = useRef<HTMLDivElement>(null);
    const hitAreaRef = useRef<HTMLButtonElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);
    const runtimeRef = useRef<{
      render: () => void;
      start: () => void;
    } | null>(null);

    const resolvedMotion = useMemo(() => {
      const profile = PROFILE_MOTION[motion?.profile ?? "reference"];
      const stiffness = clamp(
        finite(rendering?.motion?.springStiffness, profile.springStiffness),
        1,
        100,
      );
      const bounceDurationMs = finite(
        rendering?.motion?.bounceDurationMs,
        profile.bounceDurationMs,
      );

      return {
        pitchArc: clamp(finite(motion?.pitchArc, 0), -30, 30),
        spinOnPress: motion?.spinOnPress ?? interactive,
        direction: motion?.direction ?? "clockwise",
        turns: motion?.turns ?? 1,
        idle: motion?.idle ?? "bounce",
        spinDegrees: finite(rendering?.motion?.spinDegrees, 360),
        springStiffness: stiffness,
        springDamping: clamp(
          finite(rendering?.motion?.springDamping, 2 * Math.sqrt(stiffness)),
          0.1,
          50,
        ),
        bounceHeight: clamp(
          finite(rendering?.motion?.bounceHeight, profile.bounceHeight),
          0,
          size * 0.25,
        ),
        bounceDurationMs: Math.max(1, bounceDurationMs),
        bouncePhaseMs: finite(rendering?.motion?.bouncePhaseMs, 0),
      };
    }, [interactive, motion, rendering?.motion, size]);

    const resolvedMaterial = useMemo(() => {
      const reference = preset === "aave" ? REFERENCE_AAVE : REFERENCE_GHO;
      return {
        ...(material ? deriveMaterialTokens(material.color) : reference),
        ...(rendering?.material?.tokens ?? {}),
      };
    }, [material, preset, rendering?.material?.tokens]);

    const resolvedField = useMemo(() => {
      const defaultField: MintformLowerField =
        preset === "sgho"
          ? { color: "color(display-p3 0.61 0.57 0.98)", reach: 0.5 }
          : false;
      const requestedField =
        lowerField === undefined ? defaultField : lowerField;

      if (requestedField === false) {
        return {
          enabled: false,
          color: "transparent",
          transparentAt: 100,
          opaqueAt: 100,
        };
      }

      const reach = clamp(finite(requestedField.reach, 0.5), 0.05, 1);
      const softness = clamp(finite(requestedField.softness, 0.3), 0.01, reach);
      const transparentAt = (1 - reach) * 100;

      return {
        enabled: true,
        color: requestedField.color,
        transparentAt,
        opaqueAt: Math.min(100, transparentAt + softness * 100),
      };
    }, [lowerField, preset]);

    const resolvedShadow = useMemo(() => {
      const isEnabled = shadow !== false;
      const normalShadow = shadow === false ? undefined : shadow;
      const intensity = clamp(finite(normalShadow?.intensity, 1), 0, 1);

      return {
        enabled: isEnabled && intensity > 0,
        color: normalShadow?.color
          ? normalShadow.color
          : resolvedField.enabled
            ? resolvedField.color
            : resolvedMaterial.faceBase,
        baseWidth: 75,
        widthReduction: 55,
        baseOpacity: 0.1 * intensity,
        bounceOpacityReduction: 0.05 * intensity,
        bounceScaleReduction: 0.2,
        bottom: finite(rendering?.shadow?.bottom, 40),
        blur: Math.max(0, finite(rendering?.shadow?.blur, 4)),
        spread: Math.max(0, finite(rendering?.shadow?.spread, 4)),
      };
    }, [
      rendering?.shadow?.blur,
      rendering?.shadow?.bottom,
      rendering?.shadow?.spread,
      resolvedField.color,
      resolvedField.enabled,
      resolvedMaterial.faceBase,
      shadow,
    ]);

    const resolvedFace = useMemo(() => {
      const rimInset = clamp(
        finite(rendering?.face?.rimInset, DEFAULT_FACE.rimInset),
        0,
        60,
      );
      const innerRingInset = clamp(
        finite(rendering?.face?.innerRingInset, DEFAULT_FACE.innerRingInset),
        rimInset,
        72,
      );
      const surfaceInset = clamp(
        finite(rendering?.face?.surfaceInset, DEFAULT_FACE.surfaceInset),
        innerRingInset,
        78,
      );

      return {
        ...DEFAULT_FACE,
        rimInset,
        innerRingInset,
        surfaceInset,
        outerGradient:
          rendering?.face?.gradients?.outer ?? DEFAULT_FACE.outerGradient,
        rimGradient:
          rendering?.face?.gradients?.rim ?? DEFAULT_FACE.rimGradient,
        innerRingGradient:
          rendering?.face?.gradients?.innerRing ??
          DEFAULT_FACE.innerRingGradient,
        surfaceGradient:
          rendering?.face?.gradients?.surface ?? DEFAULT_FACE.surfaceGradient,
      };
    }, [rendering?.face]);

    const safeSegments = clamp(
      Math.round(finite(rendering?.edge?.segments, DETAIL_SEGMENTS[detail])),
      24,
      240,
    );
    const panelWidthRatio = clamp(
      finite(rendering?.edge?.panelWidthRatio, 3.4),
      MIN_PANEL_WIDTH_RATIO,
      MAX_PANEL_WIDTH_RATIO,
    );
    const edgePanelWidth = (panelWidthRatio * size) / safeSegments;
    const edgePanelRadius = (size / 2) * Math.cos(edgePanelWidth / size);
    const ridgeIds = useMemo(
      () =>
        Array.from({ length: safeSegments }, (_, index) => `ridge-${index}`),
      [safeSegments],
    );
    const accentEvery =
      edge?.finish === "uniform" || edge?.accentEvery === false
        ? 0
        : edge?.accentEvery === 3 || edge?.accentEvery === 4
          ? edge.accentEvery
          : 2;
    const markColor = markColorFor(resolvedMark, resolvedMaterial.mark);
    const frontMarkColor = markColorFor(frontMark, resolvedMaterial.mark);
    const backMarkColor = markColorFor(backMark, resolvedMaterial.mark);
    const palette: ResolvedPalette = {
      faceBase: resolvedMaterial.faceBase,
      faceMid: resolvedMaterial.faceMid,
      faceShadow: resolvedMaterial.faceShadow,
      faceHighlight: resolvedMaterial.faceHighlight,
      faceDepthHighlight: resolvedMaterial.faceDepthHighlight,
      logo: markColor,
      edgePrimary: rendering?.edge?.baseColor ?? resolvedMaterial.edgeBase,
      edgeAlternate: edge?.accentColor ?? resolvedMaterial.edgeAccent,
    };

    const spin = useCallback(
      (options?: MintformSpinOptions) => {
        const direction = options?.direction ?? resolvedMotion.direction;
        const turns = options?.turns ?? resolvedMotion.turns;
        let multiplier = 1;

        if (direction === "counterclockwise") multiplier = -1;
        if (direction === "alternate") {
          multiplier = alternateDirectionRef.current;
          alternateDirectionRef.current *= -1;
        }

        const state = animationRef.current;
        state.usesPitchArc = true;
        state.pitchStartOffset = pitchArcOffset(
          state.rotation,
          state.pitchOrigin,
          state.pitchTarget,
          state.pitchStartOffset,
          resolvedMotion.pitchArc,
        );
        state.pitchOrigin = state.rotation;
        state.target += resolvedMotion.spinDegrees * turns * multiplier;
        state.pitchTarget = state.target;

        if (reducedMotionRef.current) {
          state.rotation = state.target;
          state.velocity = 0;
          runtimeRef.current?.render();
        } else {
          runtimeRef.current?.start();
        }

        onSpin?.();
      },
      [onSpin, resolvedMotion],
    );

    const reset = useCallback(() => {
      const state = animationRef.current;
      state.rotation = initialRotationRef.current;
      state.target = initialRotationRef.current;
      state.velocity = 0;
      state.tilt = pitch;
      state.tiltTarget = pitch;
      state.tiltVelocity = 0;
      state.usesPitchArc = false;
      state.pitchOrigin = initialRotationRef.current;
      state.pitchTarget = initialRotationRef.current;
      state.pitchStartOffset = 0;
      runtimeRef.current?.render();
    }, [pitch]);

    useImperativeHandle(ref, () => ({ spin, reset }), [reset, spin]);

    useEffect(() => {
      const body = bodyRef.current;
      if (!body) return;
      const root = rootRef.current;
      const initialState = animationRef.current;
      if (!dragStateRef.current) {
        initialState.tilt = pitch;
        initialState.tiltTarget = pitch;
        initialState.tiltVelocity = 0;
      }

      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedMotionRef.current = media.matches;
      const onPreferenceChange = (event: MediaQueryListEvent) => {
        reducedMotionRef.current = event.matches;
        runtimeRef.current?.render();
        if (!event.matches) runtimeRef.current?.start();
      };
      media.addEventListener("change", onPreferenceChange);

      let frameId: number | null = null;
      let disposed = false;
      const startedAt = performance.now();
      let lastTime = startedAt;
      let isInViewport = true;
      let previousFrame: AppliedFrame = null;
      let animationActive = false;

      const canAnimate = () =>
        isInViewport && document.visibilityState === "visible";
      const setAnimationActive = (active: boolean) => {
        if (!root || animationActive === active) return;
        animationActive = active;
        root.dataset.mintformAnimating = active ? "true" : "false";
      };

      const render = (now: number) => {
        const state = animationRef.current;
        const reduced = reducedMotionRef.current;
        const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        const spinning =
          Math.abs(state.target - state.rotation) >= 0.02 ||
          Math.abs(state.velocity) >= 0.02;
        const tilting =
          Math.abs(state.tiltTarget - state.tilt) >= 0.02 ||
          Math.abs(state.tiltVelocity) >= 0.02;

        if (!reduced && spinning) {
          const acceleration =
            resolvedMotion.springStiffness * (state.target - state.rotation) -
            resolvedMotion.springDamping * state.velocity;
          state.velocity += acceleration * deltaSeconds;
          state.rotation += state.velocity * deltaSeconds;

          if (
            Math.abs(state.target - state.rotation) < 0.02 &&
            Math.abs(state.velocity) < 0.02
          ) {
            state.rotation = state.target;
            state.velocity = 0;
          }
        }

        if (!reduced && tilting) {
          const acceleration =
            resolvedMotion.springStiffness * (state.tiltTarget - state.tilt) -
            resolvedMotion.springDamping * state.tiltVelocity;
          state.tiltVelocity += acceleration * deltaSeconds;
          state.tilt += state.tiltVelocity * deltaSeconds;

          if (
            Math.abs(state.tiltTarget - state.tilt) < 0.02 &&
            Math.abs(state.tiltVelocity) < 0.02
          ) {
            state.tilt = state.tiltTarget;
            state.tiltVelocity = 0;
          }
        }

        const bounceTime = now - startedAt - resolvedMotion.bouncePhaseMs;
        const phase =
          bounceTime <= 0 ? 0 : bounceTime / resolvedMotion.bounceDurationMs;
        const bounce =
          reduced || resolvedMotion.idle !== "bounce" ? 0 : pingPong(phase);
        const pitchOffset =
          spinning && state.usesPitchArc
            ? pitchArcOffset(
                state.rotation,
                state.pitchOrigin,
                state.pitchTarget,
                state.pitchStartOffset,
                resolvedMotion.pitchArc,
              )
            : 0;
        const animatedPitch = clamp(state.tilt + pitchOffset, -45, 45);
        const normal = projectCoinNormal(state.rotation, animatedPitch);
        const screenNormalLength = Math.hypot(normal.x, normal.y);
        const shading = shadingForNormal(normal, resolvedLighting);

        previousFrame = applyFrame(
          {
            body,
            shadowTrack: shadowTrackRef.current,
            shadow: shadowRef.current,
            hitArea: hitAreaRef.current,
          },
          {
            y: -resolvedMotion.bounceHeight * bounce,
            rotation: state.rotation,
            pitch: animatedPitch,
            shadowScale: 1 - resolvedShadow.bounceScaleReduction * bounce,
            shadowOpacity:
              resolvedShadow.baseOpacity -
              resolvedShadow.bounceOpacityReduction * bounce,
            shadowWidth:
              resolvedShadow.baseWidth -
              resolvedShadow.widthReduction * screenNormalLength,
            shadowX: 4 * normal.x * sizeScale,
            faceShade: shading.faceShade,
            edgeShade: shading.edgeShade,
          },
          previousFrame,
        );
      };

      const shouldContinue = () => {
        const state = animationRef.current;
        const spinning =
          Math.abs(state.target - state.rotation) >= 0.02 ||
          Math.abs(state.velocity) >= 0.02;
        const tilting =
          Math.abs(state.tiltTarget - state.tilt) >= 0.02 ||
          Math.abs(state.tiltVelocity) >= 0.02;

        return (
          canAnimate() &&
          !reducedMotionRef.current &&
          (spinning || tilting || resolvedMotion.idle === "bounce")
        );
      };

      const tick = (now: number) => {
        frameId = null;
        if (!canAnimate()) {
          setAnimationActive(false);
          return;
        }
        render(now);

        if (!disposed && shouldContinue()) {
          frameId = requestAnimationFrame(tick);
        } else {
          setAnimationActive(false);
        }
      };

      const start = () => {
        if (disposed || frameId !== null || !canAnimate()) return;
        lastTime = performance.now();
        setAnimationActive(true);
        frameId = requestAnimationFrame(tick);
      };

      const onVisibilityChange = () => {
        if (!canAnimate()) setAnimationActive(false);
        if (canAnimate() && shouldContinue()) start();
      };

      const observer =
        root && "IntersectionObserver" in window
          ? new IntersectionObserver(([entry]) => {
              isInViewport = entry.isIntersecting;
              if (!canAnimate()) setAnimationActive(false);
              if (canAnimate() && shouldContinue()) start();
            })
          : null;
      if (root && observer) observer.observe(root);
      document.addEventListener("visibilitychange", onVisibilityChange);

      runtimeRef.current = {
        render: () => render(performance.now()),
        start,
      };

      runtimeRef.current.render();
      if (!reducedMotionRef.current && resolvedMotion.idle === "bounce") {
        start();
      }

      return () => {
        disposed = true;
        if (frameId !== null) cancelAnimationFrame(frameId);
        runtimeRef.current = null;
        media.removeEventListener("change", onPreferenceChange);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        observer?.disconnect();
        setAnimationActive(false);
      };
    }, [resolvedMotion, resolvedShadow, pitch, resolvedLighting, sizeScale]);

    const cssVars: CSSVars = {
      "--mintform-size": `${size}px`,
      "--mintform-thickness": `${thickness}px`,
      "--mintform-segments": safeSegments,
      "--mintform-edge-panel-width": `${edgePanelWidth}px`,
      "--mintform-edge-panel-radius": `${edgePanelRadius}px`,
      "--mintform-material-base-raw": palette.faceBase,
      "--mintform-material-mid-raw": palette.faceMid,
      "--mintform-material-shadow-raw": palette.faceShadow,
      "--mintform-material-highlight-raw": palette.faceHighlight,
      "--mintform-material-depth-highlight-raw": palette.faceDepthHighlight,
      "--mintform-logo-color": palette.logo,
      "--mintform-focus-ring": "#1d1b26",
      "--mintform-edge-primary": palette.edgePrimary,
      "--mintform-edge-alternate": palette.edgeAlternate,
      "--mintform-rim-inset": `${resolvedFace.rimInset * sizeScale}px`,
      "--mintform-inner-ring-inset": `${resolvedFace.innerRingInset * sizeScale}px`,
      "--mintform-surface-inset": `${resolvedFace.surfaceInset * sizeScale}px`,
      "--mintform-field-transparent-at": `${resolvedField.transparentAt}%`,
      "--mintform-field-opaque-at": `${resolvedField.opaqueAt}%`,
      "--mintform-field-overlay": `color-mix(in oklab, ${resolvedField.color} 82%, transparent)`,
      "--mintform-shadow-color": resolvedShadow.color,
      "--mintform-shadow-bottom": `${resolvedShadow.bottom}px`,
      "--mintform-shadow-blur": `${resolvedShadow.blur}px`,
      "--mintform-shadow-spread": `${resolvedShadow.spread}px`,
    };

    const bodyCssVars: CSSVars = {
      "--mintform-face-outer-gradient": resolvedFace.outerGradient,
      "--mintform-face-rim-gradient": resolvedFace.rimGradient,
      "--mintform-face-inner-gradient": resolvedFace.innerRingGradient,
      "--mintform-face-surface-gradient": resolvedFace.surfaceGradient,
    };

    const edgeSegments = ridgeIds.map((ridgeId, index) => {
      const isAlternate = accentEvery > 0 && (index + 1) % accentEvery === 0;
      const fieldStrength = resolvedField.enabled
        ? ridgeFieldStrength(
            index,
            safeSegments,
            resolvedField.transparentAt,
            resolvedField.opaqueAt,
          )
        : 0;
      const fieldOverlay =
        fieldStrength > 0
          ? `color-mix(in oklab, ${resolvedField.color} ${Math.round(fieldStrength * 82)}%, transparent)`
          : "transparent";

      return (
        <div
          className="mintform__edge-slice"
          data-band={isAlternate ? "alternate" : "primary"}
          key={ridgeId}
          style={
            {
              "--mintform-slice-index": index,
              "--mintform-ridge-field-overlay": fieldOverlay,
            } as CSSVars
          }
        />
      );
    });

    const handlePress = () => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      if (resolvedMotion.spinOnPress) {
        spin();
      } else {
        onSpin?.();
      }
    };

    const endDrag = (
      event: ReactPointerEvent<HTMLButtonElement>,
      cancelled = false,
    ) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dragStateRef.current = null;
      rootRef.current?.removeAttribute("data-mintform-dragging");

      if (!drag.moved) return;

      suppressClickRef.current = true;
      // Browsers dispatch a drag's synthetic click immediately after pointer
      // release when they dispatch one at all. Clear on the next task so that
      // event is ignored without accidentally swallowing the user's next tap.
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      const state = animationRef.current;
      const flickDegrees = cancelled
        ? 0
        : clamp(drag.yawVelocity * 0.15, -MAX_FLICK_DEGREES, MAX_FLICK_DEGREES);

      state.target = state.rotation + flickDegrees;
      state.velocity = 0;
      state.tiltTarget = pitch;
      state.tiltVelocity = 0;
      state.usesPitchArc = false;
      state.pitchOrigin = state.rotation;
      state.pitchTarget = state.rotation;
      state.pitchStartOffset = 0;

      if (reducedMotionRef.current) {
        state.rotation = state.target;
        state.tilt = pitch;
        runtimeRef.current?.render();
      } else {
        runtimeRef.current?.start();
      }
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (
        !dragEnabled ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      const state = animationRef.current;
      // A press spin may be halfway through its temporary pitch arc. Fold that
      // currently visible offset into the direct-manipulation state before
      // cancelling the arc so grabbing a moving coin never causes a tilt jump.
      const visibleTilt = clamp(
        state.tilt +
          (state.usesPitchArc
            ? pitchArcOffset(
                state.rotation,
                state.pitchOrigin,
                state.pitchTarget,
                state.pitchStartOffset,
                resolvedMotion.pitchArc,
              )
            : 0),
        -45,
        45,
      );
      state.target = state.rotation;
      state.velocity = 0;
      state.tilt = visibleTilt;
      state.tiltTarget = visibleTilt;
      state.tiltVelocity = 0;
      state.usesPitchArc = false;
      state.pitchOrigin = state.rotation;
      state.pitchTarget = state.rotation;
      state.pitchStartOffset = 0;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startRotation: state.rotation,
        startTilt: visibleTilt,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        yawVelocity: 0,
        moved: false,
      };
      rootRef.current?.setAttribute("data-mintform-dragging", "true");
      runtimeRef.current?.render();
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_START_DISTANCE) {
        return;
      }

      drag.moved = true;
      event.preventDefault();
      const state = animationRef.current;
      state.rotation = drag.startRotation + deltaX * DRAG_YAW_DEGREES_PER_PIXEL;
      state.target = state.rotation;
      state.velocity = 0;
      state.tilt = clamp(
        drag.startTilt - deltaY * DRAG_TILT_DEGREES_PER_PIXEL,
        -45,
        45,
      );
      state.tiltTarget = state.tilt;
      state.tiltVelocity = 0;

      const elapsedSeconds = (event.timeStamp - drag.lastTime) / 1000;
      if (elapsedSeconds > 0) {
        const instantaneousVelocity =
          ((event.clientX - drag.lastX) * DRAG_YAW_DEGREES_PER_PIXEL) /
          elapsedSeconds;
        drag.yawVelocity = clamp(instantaneousVelocity, -1440, 1440);
      }
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      runtimeRef.current?.render();
    };

    const handleButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
      onButtonClick?.(event);
      if (!event.defaultPrevented) handlePress();
    };

    const handleButtonPointerDown = (
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      handlePointerDown(event);
      onButtonPointerDown?.(event);
    };

    const handleButtonPointerMove = (
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      handlePointerMove(event);
      onButtonPointerMove?.(event);
    };

    const handleButtonPointerUp = (
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      endDrag(event);
      onButtonPointerUp?.(event);
    };

    const handleButtonPointerCancel = (
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      endDrag(event, true);
      onButtonPointerCancel?.(event);
    };
    return (
      <div
        {...rootProps}
        ref={rootRef}
        className={`mintform ${className}`.trim()}
        data-mintform-preset={preset}
        data-mintform-drag={dragEnabled ? "true" : undefined}
        style={{ ...cssVars, ...safeStyle }}
      >
        <div ref={bodyRef} className="mintform__body" style={bodyCssVars}>
          <div
            className="mintform__edge-shell"
            data-finish={edge?.finish ?? "reeded"}
          >
            {edgeSegments}
          </div>
          <Face
            side="front"
            mark={frontMark}
            markColor={frontMarkColor}
            size={size}
            hasLowerField={resolvedField.enabled}
          />
          <div className="mintform__face-inner--front" aria-hidden="true" />
          <Face
            side="back"
            mark={backMark}
            markColor={backMarkColor}
            size={size}
            hasLowerField={resolvedField.enabled}
          />
          <div className="mintform__face-inner--back" aria-hidden="true" />
        </div>

        {resolvedShadow.enabled && (
          <div ref={shadowTrackRef} className="mintform__shadow-track">
            <div ref={shadowRef} className="mintform__shadow" />
          </div>
        )}

        {interactive && (
          <button
            {...restButtonProps}
            ref={hitAreaRef}
            className="mintform__hit-area"
            type="button"
            aria-label={buttonAriaLabel ?? ariaLabel}
            onClick={handleButtonClick}
            onPointerDown={handleButtonPointerDown}
            onPointerMove={handleButtonPointerMove}
            onPointerUp={handleButtonPointerUp}
            onPointerCancel={handleButtonPointerCancel}
          />
        )}
      </div>
    );
  },
);
