import { nextTokyoDay, parseWeatherDay } from "./schema";
import type { WeatherDay } from "./schema";
import { recoveryReason } from "../interface/recovery";

export async function loadTokyoWeather(): Promise<WeatherDay> {
  const response = await fetch("/api/weather", {
    signal: AbortSignal.timeout(10_000),
    cache: recoveryReason() ? "reload" : "default",
  });
  if (!response.ok) throw new Error("本日の東京の天気予報を取得できませんでした。");
  const value: unknown = await response.json();
  const weather = parseWeatherDay(value);
  if (weather.expiresAt <= Date.now()) throw new Error("本日の天気予報が必要です。");
  return weather;
}

export function observeTokyoWeather(
  initial: WeatherDay,
  update: (weather: WeatherDay) => void,
  fail: (error: unknown) => void,
) {
  let current = initial;
  let nextAttemptAt = initial.expiresAt;
  let pending = false;
  async function refresh(): Promise<void> {
    if (document.hidden || pending || Date.now() < nextAttemptAt) return;
    pending = true;
    nextAttemptAt = nextTokyoDay(Date.now());
    try {
      current = await loadTokyoWeather();
      nextAttemptAt = current.expiresAt;
      update(current);
    } catch (error) {
      fail(error);
    } finally {
      pending = false;
    }
  }
  setInterval(refresh, 60_000);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("pageshow", refresh);
  return {
    get current(): WeatherDay {
      return current;
    },
    refresh,
  };
}
