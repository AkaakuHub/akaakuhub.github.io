import { MathUtils } from "three";
import type { Color } from "three";

export const photometry = {
  scale: 1 / 1000,
  solarIlluminance: 120_000,
  skyIlluminance: 18_000,
  moonIlluminance: 0.3,
  nightSkyIlluminance: 0.002,
  tubeLumens: 3350,
  nightEv100: 7,
  unlitNightEv100: 2,
  dayEv100: 10,
} as const;

export function unitLuminance(color: Color): Color {
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return color.multiplyScalar(1 / luminance);
}

export function cameraExposure(daylight: number, roomLightsOn: boolean): number {
  const nightEv = roomLightsOn ? photometry.nightEv100 : photometry.unlitNightEv100;
  const ev100 = MathUtils.lerp(nightEv, photometry.dayEv100, daylight);
  return 1 / (photometry.scale * 1.2 * 2 ** ev100);
}
