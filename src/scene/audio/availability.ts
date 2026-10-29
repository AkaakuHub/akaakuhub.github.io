import type { SoundWeather } from "./mix";

export const windSoundThreshold = 0.5;

export function hasWeatherSound(weather: SoundWeather): boolean {
  return weather.rain > 0 || weather.windSpeed > windSoundThreshold;
}
