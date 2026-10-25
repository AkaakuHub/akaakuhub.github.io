import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import type { TokyoWeather } from "../../weather/schema";
import { tokyo } from "../../weather/schema";
import type { Notice } from "./notices";
import { weatherDescription, windDescription } from "../../weather/description";
import { siteFont } from "../../assets/typography";

export function createWeatherNotice() {
  const canvas = document.createElement("canvas");
  canvas.width = 2240;
  canvas.height = 120;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("天気の掲示を作成できません。");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const object = new Mesh(
    new PlaneGeometry(2.24, 0.12),
    new MeshStandardMaterial({ map: texture, roughness: 0.85 }),
  );
  object.position.set(0, 1.145, 0.047);
  object.receiveShadow = true;
  const notice: Notice = {
    title: "東京の天気",
    size: [2.24, 0.12],
    link: { label: "Open-Meteoを開く", href: "https://open-meteo.com/" },
  };
  const clock = new Intl.DateTimeFormat("ja-JP", {
    timeZone: tokyo.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  let failed = false;
  function draw(lines: readonly string[]): void {
    if (!context) return;
    context.fillStyle = "#f3f0e5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#294037";
    context.font = `30px ${siteFont}`;
    lines.forEach((line, index) => context.fillText(line, 36, 46 + index * 43));
    context.font = `24px ${siteFont}`;
    context.fillText("Weather data by Open-Meteo ↗", 1760, 87);
    texture.needsUpdate = true;
  }
  draw(["天気を取得中"]);
  return {
    object,
    notice,
    update(weather: TokyoWeather, date: Date): void {
      if (failed) return;
      draw([
        `東京 ${clock.format(date)} JST　${weatherDescription(weather)}　${windDescription(weather)}`,
        `雨 ${weather.rain.toFixed(1)}mm/h　雪 ${weather.snowfall.toFixed(1)}cm/h　雲量 ${Math.round(weather.cloudCover)}%　1日1回取得・時間別予報`,
      ]);
    },
    loaded(): void {
      failed = false;
    },
    fail(): void {
      failed = true;
      draw(["天気を更新できません", "でした"]);
    },
  };
}
