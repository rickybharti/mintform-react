import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  clamp,
  finite,
  projectCoinNormal,
  ridgeFieldStrength,
} from "../src/core/geometry";
import { deriveMaterialTokens } from "../src/Mintform";

function hexColor(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

describe("Mintform geometry invariants", () => {
  it("clamps and normalizes non-finite input safely", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(finite(Number.NaN, 16)).toBe(16);
    expect(finite(Number.POSITIVE_INFINITY, 16)).toBe(16);
  });

  it("keeps projected normals unit-length and lower-ridge material strengths safe", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1440, max: 1440, noNaN: true }),
        fc.double({ min: -45, max: 45, noNaN: true }),
        fc.integer({ min: 24, max: 240 }),
        fc.integer({ min: 0, max: 239 }),
        fc.double({ min: 0, max: 95, noNaN: true }),
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        (yaw, pitch, segments, index, transparentAt, softness) => {
          const normal = projectCoinNormal(yaw, pitch);
          const normalLength = Math.hypot(normal.x, normal.y, normal.z);
          const opaqueAt = Math.min(100, transparentAt + softness);
          const strength = ridgeFieldStrength(
            index,
            segments,
            transparentAt,
            opaqueAt,
          );

          expect(normalLength).toBeCloseTo(1, 10);
          expect(strength).toBeGreaterThanOrEqual(0);
          expect(strength).toBeLessThanOrEqual(1);
          expect(Number.isFinite(strength)).toBe(true);
        },
      ),
      { numRuns: 500 },
    );
  });

  it("keeps the top ridges clear and fully tints the physical bottom", () => {
    expect(ridgeFieldStrength(0, 120, 50, 80)).toBe(0);
    expect(ridgeFieldStrength(60, 120, 50, 80)).toBe(1);
  });
});

describe("Mintform material derivation", () => {
  it("derives a complete, finite palette from every sRGB hex colour", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffff }), (value) => {
        const color = hexColor(value);
        const tokens = deriveMaterialTokens(color);

        expect(tokens.faceBase).toBe(color);
        expect(tokens.edgeBase).toBe(color);
        expect(tokens.mark).toBe("#ffffff");
        expect(
          Object.values(tokens).every((token) => !token.includes("NaN")),
        ).toBe(true);
      }),
      { numRuns: 500 },
    );
  });
});
