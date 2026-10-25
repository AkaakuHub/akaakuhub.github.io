import {
  parseWeather,
  tokyo,
  weatherNumber,
  weatherRecord,
  weatherRefreshMs,
} from "../../src/weather/schema";
import type { TokyoWeather } from "../../src/weather/schema";

export async function fetchTokyoWeather(): Promise<TokyoWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(tokyo.latitude),
    longitude: String(tokyo.longitude),
    current: "cloud_cover,precipitation,direct_normal_irradiance,diffuse_radiation",
    timeformat: "unixtime",
    timezone: tokyo.timezone,
    forecast_days: "1",
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`天気情報の取得に失敗しました: ${response.status}`);
  const value: unknown = await response.json();
  const current = weatherRecord(weatherRecord(value).current);
  const fetchedAt = Date.now();
  const observedAt = weatherNumber(current, "time", 0, Number.MAX_SAFE_INTEGER) * 1000;
  if (Math.abs(fetchedAt - observedAt) > 60 * 60 * 1000)
    throw new Error("現在の天気情報を取得できませんでした。");
  return parseWeather({
    observedAt,
    fetchedAt,
    expiresAt: fetchedAt + weatherRefreshMs,
    cloudCover: weatherNumber(current, "cloud_cover", 0, 100),
    precipitation: weatherNumber(current, "precipitation", 0, 1000),
    directRadiation: weatherNumber(current, "direct_normal_irradiance", 0, 2000),
    diffuseRadiation: weatherNumber(current, "diffuse_radiation", 0, 2000),
  });
}
