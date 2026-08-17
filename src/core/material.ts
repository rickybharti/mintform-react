import { clamp } from "./geometry";

export type MaterialTokens = {
  faceBase: string;
  faceMid: string;
  faceShadow: string;
  faceHighlight: string;
  faceDepthHighlight: string;
  edgeBase: string;
  edgeAccent: string;
  mark: string;
};

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

/** Derives a coherent material palette from one intentional colour. */
export function deriveMaterialTokens(color: string): MaterialTokens {
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
