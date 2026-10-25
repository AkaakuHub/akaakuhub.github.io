import { nextTokyoDay, parseWeatherDay, tokyo, weatherRecord } from "../../src/weather/schema";
import type { WeatherDay } from "../../src/weather/schema";

function series(record: Record<string, unknown>, key: string): number[] {
  const values: unknown = record[key];
  if (
    !Array.isArray(values) ||
    values.length < 25 ||
    !values.every((value: unknown) => typeof value === "number" && Number.isFinite(value))
  )
    throw new Error(`時間別予報の${key}を取得できませんでした。`);
  return values.slice(0, 25) as number[];
}

export async function fetchTokyoWeather(): Promise<WeatherDay> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(tokyo.latitude),
    longitude: String(tokyo.longitude),
    hourly: "cloud_cover,precipitation,direct_normal_irradiance_instant,diffuse_radiation_instant",
    timeformat: "unixtime",
    timezone: tokyo.timezone,
    forecast_days: "2",
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`天気予報の取得に失敗しました: ${response.status}`);
  const value: unknown = await response.json();
  const hourly = weatherRecord(weatherRecord(value).hourly);
  const times = series(hourly, "time");
  const cloud = series(hourly, "cloud_cover");
  const rain = series(hourly, "precipitation");
  const direct = series(hourly, "direct_normal_irradiance_instant");
  const diffuse = series(hourly, "diffuse_radiation_instant");
  const fetchedAt = Date.now();
  return parseWeatherDay({
    fetchedAt,
    expiresAt: nextTokyoDay(fetchedAt),
    hours: times.slice(0, 25).map((time, index) => ({
      time: time * 1000,
      cloudCover: cloud[index],
      precipitation: rain[index],
      directRadiation: direct[index],
      diffuseRadiation: diffuse[index],
    })),
  });
}
