import type { TokyoWeather } from "../../weather/schema";
import type { SoundName } from "./assets";
import { getPosition, getTimes } from "suncalc";
import { tokyo } from "../../weather/schema";
import { windSoundThreshold } from "./availability";

export type SoundWeather = Pick<TokyoWeather, "rain" | "windSpeed" | "windDirection">;

function smooth(value: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function weatherMix(weather: SoundWeather, date: Date): Record<SoundName, number> {
  const rain = Math.min(1, Math.sqrt(Math.max(0, weather.rain) / 3));
  const wind = Math.min(1, Math.max(0, weather.windSpeed - windSoundThreshold) / 8);
  const windward = 0.6 + 0.4 * Math.max(0, Math.cos((weather.windDirection * Math.PI) / 180));
  const { altitude } = getPosition(date, tokyo.latitude, tokyo.longitude);
  const { sunrise } = getTimes(date, tokyo.latitude, tokyo.longitude, 0, 540);
  if (!sunrise) throw new Error("東京の日の出時刻を計算できませんでした。");
  const daylight = smooth(altitude, 0, 6);
  const morning = 1 - smooth((date.getTime() - sunrise.getTime()) / 3_600_000, 1, 3);
  return {
    rain,
    window: rain * (0.25 + wind * 0.2) * windward,
    gutter: rain * 0.28,
    wind: Math.sqrt(wind) * 0.45,
    dayRain: rain * daylight * (0.08 + morning * 0.2) * (1 - rain * 0.8) * (1 - wind * 0.8),
  };
}
