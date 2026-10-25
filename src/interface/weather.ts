import { tokyo } from "../weather/schema";
import type { TokyoWeather } from "../weather/schema";

export function createWeatherStatus(root: HTMLElement) {
  const label = root.querySelector<HTMLElement>(".weather-status");
  if (!label) throw new Error("天気の表示先が見つかりません。");
  const time = new Intl.DateTimeFormat("ja-JP", {
    timeZone: tokyo.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  let failed = false;
  return {
    update(weather: TokyoWeather, date: Date): void {
      if (!failed)
        label.textContent = `東京 ${time.format(date)}・雲${Math.round(weather.cloudCover)}%・降水${weather.precipitation.toFixed(1)}mm`;
      label.title = `${time.format(weather.fetchedAt)}取得・${time.format(weather.observedAt)}の時間別予報`;
    },
    loaded(): void {
      failed = false;
    },
    fail(): void {
      failed = true;
      label.textContent = "東京の天気を更新できませんでした";
    },
  };
}
