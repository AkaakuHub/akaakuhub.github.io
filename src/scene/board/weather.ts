import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import type { TokyoWeather } from "../../weather/schema";
import { tokyo } from "../../weather/schema";
import type { Notice } from "./notices";
import { weatherDescription, windDescription } from "../../weather/description";

export function createWeatherNotice() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 896;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("天気の掲示を作成できません。");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const object = new Mesh(
    new PlaneGeometry(0.65, 0.91),
    new MeshStandardMaterial({ map: texture, roughness: 0.85 }),
  );
  object.position.set(0.84, 1.72, 0.047);
  object.receiveShadow = true;
  const notice: Notice = {
    title: "東京の天気",
    size: [0.65, 0.91],
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
    context.font = "bold 44px sans-serif";
    context.fillText("東京の天気", 48, 88);
    context.fillRect(48, 114, 544, 3);
    context.font = "32px sans-serif";
    lines.forEach((line, index) => context.fillText(line, 48, 188 + index * 62));
    context.font = "24px sans-serif";
    context.fillText("1日1回取得・時間別予報", 48, 714);
    context.fillText("Weather data by", 48, 790);
    context.fillText("Open-Meteo ↗", 48, 832);
    texture.needsUpdate = true;
  }
  draw(["天気を取得中"]);
  return {
    object,
    notice,
    update(weather: TokyoWeather, date: Date): void {
      if (failed) return;
      draw([
        `${clock.format(date)} JST`,
        weatherDescription(weather),
        `雨 ${weather.rain.toFixed(1)}mm/h`,
        `雪 ${weather.snowfall.toFixed(1)}cm/h`,
        windDescription(weather),
        `雲量 ${Math.round(weather.cloudCover)}%`,
        `${clock.format(weather.fetchedAt)}取得`,
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
