import type { TokyoWeather } from "../../weather/schema";
import type { SoundName } from "./assets";

export type SoundWeather = Pick<TokyoWeather, "rain" | "windSpeed" | "windDirection">;

export function weatherMix(weather: SoundWeather): Record<SoundName, number> {
  const rain = Math.min(1, Math.sqrt(Math.max(0, weather.rain) / 6));
  const wind = Math.min(1, Math.max(0, weather.windSpeed - 0.5) / 10);
  const windward = 0.65 + 0.35 * Math.abs(Math.sin((weather.windDirection * Math.PI) / 180));
  return {
    rain: rain * 0.8,
    window: rain * (0.3 + wind * 0.3) * windward,
    gutter: rain * 0.42,
    wind: wind ** 1.4 * 0.55,
  };
}
