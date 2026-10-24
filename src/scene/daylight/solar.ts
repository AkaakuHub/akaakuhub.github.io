import { getPosition } from "suncalc";
import { Color, MathUtils, Vector3 } from "three";
import { photometry, unitLuminance } from "../lighting/photometry";

const latitude = 36.5732;
const longitude = 136.67774;
const northYaw = 180;

export function roomSunlight(date: Date) {
  const { altitude, azimuth } = getPosition(date, latitude, longitude);
  const elevation = MathUtils.degToRad(altitude);
  const bearing = MathUtils.degToRad(northYaw - azimuth);
  const daylight = MathUtils.smoothstep(altitude, -6, 15);
  const twilight = MathUtils.smoothstep(altitude, -12, 0);
  const highSun = MathUtils.smoothstep(altitude, 0, 40);
  const warmth = (1 - MathUtils.smoothstep(altitude, 1, 15)) * twilight;
  const airMass =
    altitude > 0 ? 1 / (Math.sin(elevation) + 0.50572 * (altitude + 6.07995) ** -1.6364) : 0;
  const intensity =
    altitude > 0
      ? photometry.solarIlluminance *
        photometry.scale *
        Math.exp(-0.16 * airMass) *
        MathUtils.smoothstep(altitude, 0, 0.5)
      : 0;
  const color = unitLuminance(new Color("#ffad63").lerp(new Color("#fff5e6"), highSun));
  const sky = new Color("#071221")
    .lerp(new Color("#657a9f"), twilight)
    .lerp(new Color("#b7d4eb"), highSun);
  sky.lerp(new Color("#c5997d"), warmth * 0.48);
  const direction = new Vector3(
    Math.cos(bearing) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.sin(bearing) * Math.cos(elevation),
  );
  return { daylight, color, direction, intensity, sky };
}
