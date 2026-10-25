import type { TokyoWeather } from "./schema";

export function weatherDescription(weather: TokyoWeather): string {
  const code = weather.weatherCode;
  if (code >= 95) return "雷雨";
  if (weather.snowfall > 0 && weather.rain > 0) return "みぞれ";
  if (weather.snowfall > 0 || (code >= 71 && code <= 77) || code === 85 || code === 86) return "雪";
  if ((code >= 66 && code <= 67) || code === 56 || code === 57) return "着氷性の雨";
  if (code >= 51 && code <= 55) return "霧雨";
  if (weather.rain > 0) return "雨";
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return "雨";
  if (code === 45 || code === 48) return "霧";
  if (code === 3) return "曇り";
  if (code === 2) return "晴れ時々曇り";
  return "晴れ";
}

export function windDescription(weather: TokyoWeather): string {
  const bearings = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const direction = bearings[Math.round(weather.windDirection / 45) % 8];
  return `風 ${direction} ${weather.windSpeed.toFixed(1)}m/s`;
}
