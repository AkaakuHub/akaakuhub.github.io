import { MathUtils } from "three";
import type { TokyoWeather } from "../../weather/schema";

export function skyAppearance(altitude: number, weather: TokyoWeather) {
  const precipitation = weather.rain > 0 || weather.snowfall > 0;
  const cloud = Math.max(weather.cloudCover / 100, precipitation ? 0.9 : 0);
  const daylight = MathUtils.smoothstep(altitude, -10, 5);
  const twilight =
    MathUtils.smoothstep(altitude, -10, -2) *
    (1 - MathUtils.smoothstep(altitude, 0, 12)) *
    (1 - cloud * 0.9);
  const rain = Math.min(1, Math.sqrt(weather.rain / 8));
  return {
    daylight,
    twilight,
    cloud,
    brightness: (1 - cloud * 0.25) * (1 - rain * 0.55),
    stars: (1 - daylight) * (1 - cloud) ** 2,
  };
}
