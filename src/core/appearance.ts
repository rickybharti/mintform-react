import { clamp, finite } from "./geometry";

export type MintformAppearance = "sculpted" | "clean";
export type MintformEdgeFinish = "reeded" | "uniform" | "smooth";
export type MintformDetailLevel = "low" | "medium" | "high";

const TARGET_PANEL_WIDTH: Record<MintformDetailLevel, number> = {
  low: 10.47,
  medium: 6.28,
  high: 4.19,
};

/**
 * Keeps ridge density visually stable as the token size changes. The target
 * widths preserve the original 48/80/120 geometry at the 160px reference size.
 * An explicit segment count remains an exact low-level override.
 */
export function resolveEdgeSegments(
  size: number,
  detail: MintformDetailLevel,
  explicitSegments?: number,
) {
  const adaptiveSegments = (Math.PI * size) / TARGET_PANEL_WIDTH[detail];
  const requested = finite(explicitSegments, adaptiveSegments);

  return clamp(Math.round(requested), 24, 240);
}

export function resolveEdgeFinish(
  appearance: MintformAppearance,
  requested?: MintformEdgeFinish,
): MintformEdgeFinish {
  return requested ?? (appearance === "clean" ? "smooth" : "reeded");
}
