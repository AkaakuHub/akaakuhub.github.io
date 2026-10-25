import { parseWeather, weatherRefreshMs } from "./schema";
import type { TokyoWeather } from "./schema";

export async function loadTokyoWeather(): Promise<TokyoWeather> {
  const response = await fetch("/api/weather", { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("東京の天気情報を取得できませんでした。");
  const value: unknown = await response.json();
  const weather = parseWeather(value);
  if (weather.expiresAt <= Date.now()) throw new Error("東京の天気情報の有効期限が切れています。");
  return weather;
}

export function observeTokyoWeather(
  initial: TokyoWeather,
  update: (weather: TokyoWeather) => void,
  fail: () => void,
) {
  let current = initial;
  let nextAttemptAt = initial.expiresAt;
  let pending = false;
  async function refresh(): Promise<void> {
    if (document.hidden || pending || Date.now() < nextAttemptAt) return;
    pending = true;
    nextAttemptAt = Date.now() + weatherRefreshMs;
    try {
      current = await loadTokyoWeather();
      nextAttemptAt = current.expiresAt;
      update(current);
    } catch {
      fail();
    } finally {
      pending = false;
    }
  }
  setInterval(refresh, 60_000);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("pageshow", refresh);
  return {
    get current(): TokyoWeather {
      return current;
    },
  };
}
