import { siteFont } from "../../../../assets/typography";
import type { Repository } from "../../../../content/schema";
import type { ReadmeState } from "../../../../content/readme";

export interface CachedCard {
  repository: Repository;
  readme: ReadmeState | undefined;
  compact: boolean;
  canvas: HTMLCanvasElement;
}

const date = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function textLines(
  context: CanvasRenderingContext2D,
  text: string,
  y: number,
  width: number,
  lineHeight: number,
  limit: number,
): number {
  const lines: string[] = [];
  let line = "";
  for (const character of text.replace(/\s+/g, " ")) {
    if (context.measureText(line + character).width > width && line) {
      lines.push(line);
      line = character;
      if (lines.length === limit) break;
    } else line += character;
  }
  if (lines.length < limit && line) lines.push(line);
  lines.forEach((value, index) =>
    context.fillText(
      index === limit - 1 && line !== value ? value.slice(0, -1) + "…" : value,
      28,
      y + index * lineHeight,
    ),
  );
  return lines.length * lineHeight;
}

export function drawRepositoryCard(
  repository: Repository,
  readme: ReadmeState | undefined,
  compact: boolean,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1096;
  canvas.height = height - 20;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("リポジトリを描画できませんでした。");
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(0.5, 0.5, canvas.width - 1, canvas.height - 1, 14);
  context.fill();
  context.strokeStyle = "#e0e7e2";
  context.stroke();
  context.fillStyle = "#203d30";
  context.font = `500 ${compact ? 43 : 36}px ${siteFont}`;
  context.fillText(repository.name, 28, 48, 990);
  context.font = `500 ${compact ? 28 : 22}px ${siteFont}`;
  context.fillStyle = "#748579";
  context.fillText(`更新 ${date.format(repository.updatedAt)}`, 28, 85);
  context.fillText("↗", 1034, 49);
  let y = compact ? 132 : 125;
  if (repository.description) {
    context.font = `500 ${compact ? 35 : 27}px ${siteFont}`;
    context.fillStyle = "#3f5548";
    y += textLines(context, repository.description, y, 1040, compact ? 44 : 34, 2) + 10;
  }
  context.fillStyle = "#87948b";
  context.font = `500 ${compact ? 25 : 20}px ${siteFont}`;
  context.fillText("README", 28, y);
  if (readme?.status === "ready" && readme.text) {
    context.fillStyle = "#576b5d";
    context.font = `500 ${compact ? 32 : 25}px ${siteFont}`;
    textLines(context, readme.text, y + (compact ? 39 : 32), 1040, compact ? 42 : 32, 3);
  }
  return canvas;
}
