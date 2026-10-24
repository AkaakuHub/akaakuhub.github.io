import { MathUtils } from "three";
import type { Color } from "three";

export const photometry = {
  scale: 1 / 1000,
  solarIlluminance: 120_000,
  skyIlluminance: 18_000,
  tubeLumens: 3350,
  nightEv100: 7,
  dayEv100: 10,
} as const;

export function unitLuminance(color: Color): Color {
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return color.multiplyScalar(1 / luminance);
}

export function cameraExposure(daylight: number): number {
  const ev100 = MathUtils.lerp(photometry.nightEv100, photometry.dayEv100, daylight);
  return 1 / (photometry.scale * 1.2 * 2 ** ev100);
}
