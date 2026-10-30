import { Color, MathUtils } from "three";
import type { TokyoWeather } from "../../weather/schema";

export function skyAppearance(altitude: number, weather: TokyoWeather) {
  const precipitation = weather.rain > 0 || weather.snowfall > 0;
  const cloud = Math.max(weather.cloudCover / 100, precipitation ? 0.9 : 0);
  const layers = cloud * 2;
  const lower = Math.floor(layers);
  const daylight = MathUtils.smoothstep(altitude, -10, 5);
  const twilight =
    MathUtils.smoothstep(altitude, -10, -2) *
    (1 - MathUtils.smoothstep(altitude, 0, 12)) *
    (1 - cloud * 0.9);
  const rain = Math.min(1, Math.sqrt(weather.rain / 8));
  const tint = new Color("#ffffff").lerp(new Color("#ffd1a3"), twilight * 0.45);
  return {
    lower,
    upper: Math.min(2, lower + 1),
    blend: layers - lower,
    daylight,
    twilight,
    cloud,
    brightness: (1 - cloud * 0.25) * (1 - rain * 0.55),
    tint,
    stars: (1 - daylight) * (1 - cloud) ** 2,
  };
}
