import { getMoonIllumination, getMoonPosition, getPosition } from "suncalc";
import { Color, MathUtils, Vector3 } from "three";
import { photometry, unitLuminance } from "../lighting/photometry";
import { celestialVisibility, lunarIrradiance } from "./visibility";

const latitude = 36.5732;
const longitude = 136.67774;
const northYaw = 180;
const moonLightGain = 0.48;
const nightSkyFill = 0.16;

function direction(altitude: number, azimuth: number): Vector3 {
  const elevation = MathUtils.degToRad(altitude);
  const bearing = MathUtils.degToRad(northYaw - azimuth);
  return new Vector3(
    Math.cos(bearing) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.sin(bearing) * Math.cos(elevation),
  );
}

export function roomCelestialLighting(date: Date) {
  const sun = getPosition(date, latitude, longitude);
  const moon = getMoonPosition(date, latitude, longitude);
  const { fraction } = getMoonIllumination(date);
  const { altitude } = sun;
  const daylight = MathUtils.smoothstep(altitude, -6, 15);
  const twilight = MathUtils.smoothstep(altitude, -12, 0);
  const highSun = MathUtils.smoothstep(altitude, 0, 40);
  const warmth = (1 - MathUtils.smoothstep(altitude, 1, 15)) * twilight;
  const lunarWeight = MathUtils.smoothstep(-altitude, 6, 12);
  const moonBrightness =
    moonLightGain *
    lunarIrradiance(fraction, moon.distance) *
    lunarWeight *
    celestialVisibility(moon.altitude);
  const moonActive = altitude <= -6;
  const color = unitLuminance(
    moonActive ? new Color("#bed2ff") : new Color("#ffad63").lerp(new Color("#fff5e6"), highSun),
  );
  const intensity = moonActive
    ? moonBrightness
    : photometry.scale * photometry.solarIlluminance * celestialVisibility(altitude);
  const exterior = new Color("#071221")
    .lerp(new Color("#657a9f"), twilight)
    .lerp(new Color("#b7d4eb"), highSun);
  exterior.lerp(new Color("#c5997d"), warmth * 0.48);
  const nightWeight = MathUtils.smoothstep(-altitude, 0, 12);
  const sky = new Color("#bed2ff").lerp(new Color("#6491eb"), nightWeight);
  const skyTwilight = MathUtils.smoothstep(altitude, -6, 6);
  const skyIntensity =
    photometry.scale * photometry.skyIlluminance * daylight +
    nightSkyFill * (1 - skyTwilight) +
    moonBrightness * 0.5;
  const source = moonActive ? moon : sun;
  return {
    color,
    direction: direction(source.altitude, source.azimuth),
    intensity,
    sky,
    skyIntensity,
    exterior,
  };
}
