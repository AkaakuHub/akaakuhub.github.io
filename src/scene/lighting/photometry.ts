import type { Color } from "three";

export const photometry = {
  scale: 1 / 1000,
  radiationScale: 0.12,
  tubeLumens: 3350,
  ev100: 8,
} as const;

export function unitLuminance(color: Color): Color {
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return color.multiplyScalar(1 / luminance);
}

export const cameraExposure = 1 / (photometry.scale * 1.2 * 2 ** photometry.ev100);
