import { clamp, type ProjectedNormal } from "./geometry";

export type MintformLightingMode = "reference" | "studio" | "dramatic";

const LIGHTING_PROFILES = {
  reference: null,
  studio: { x: -0.45, y: -0.25, z: 0.86, strength: 0.38 },
  dramatic: { x: -0.68, y: -0.4, z: 0.61, strength: 0.62 },
} as const;

function spinProgress(rotation: number, origin: number, target: number) {
  const distance = target - origin;
  if (Math.abs(distance) < 0.000001) return 1;
  return clamp((rotation - origin) / distance, 0, 1);
}

export function pitchArcOffset(
  rotation: number,
  origin: number,
  target: number,
  startOffset: number,
  arc: number,
) {
  const progress = spinProgress(rotation, origin, target);
  return startOffset * (1 - progress) + arc * Math.sin(Math.PI * progress);
}

export function shadingForNormal(
  normal: ProjectedNormal,
  lighting: MintformLightingMode,
) {
  const edgeOn = Math.hypot(normal.x, normal.y);
  const reference = {
    faceShade: edgeOn ** 2,
    edgeShade: normal.z ** 2,
  };
  const profile = LIGHTING_PROFILES[lighting];

  if (!profile) return reference;

  // Both physical faces retain the luminous token treatment while X/Y light
  // direction still changes coherently as the coin turns and tilts.
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
