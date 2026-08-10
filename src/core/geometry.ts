export type ProjectedNormal = {
  x: number;
  y: number;
  z: number;
};

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function projectCoinNormal(yaw: number, pitch: number): ProjectedNormal {
  const yawRadians = (yaw * Math.PI) / 180;
  const pitchRadians = (pitch * Math.PI) / 180;
  const yawCosine = Math.cos(yawRadians);

  // rotateX(pitch) rotateY(yaw): yaw happens in the coin's local space, then
  // the complete spinning coin is tilted toward/away from the viewer.
  return {
    x: Math.sin(yawRadians),
    y: -Math.sin(pitchRadians) * yawCosine,
    z: Math.cos(pitchRadians) * yawCosine,
  };
}

/**
 * Resolves the material strength for a sidewall ridge at a local ring angle.
 * Index 0 is at the coin's top; half a turn is its physical bottom.
 */
export function ridgeFieldStrength(
  index: number,
  segments: number,
  transparentAt: number,
  opaqueAt: number,
) {
  const safeSegments = Math.max(1, Math.round(segments));
  const angle = (index / safeSegments) * Math.PI * 2;
  const verticalPosition = (1 - Math.cos(angle)) / 2;
  const start = clamp(transparentAt / 100, 0, 1);
  const end = clamp(opaqueAt / 100, start, 1);

  if (end <= start) return verticalPosition >= end ? 1 : 0;
  return clamp((verticalPosition - start) / (end - start), 0, 1);
}
