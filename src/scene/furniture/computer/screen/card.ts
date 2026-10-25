import { siteFont } from "../../../../assets/typography";
import type { Repository } from "../../../../content/schema";
import type { ReadmeState } from "../../../../content/readme";

export interface CachedCard {
  repository: Repository;
  readme: ReadmeState | undefined;
  portrait: boolean;
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
  height: number,
  width: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
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
  context.font = `500 38px ${siteFont}`;
  const headingHeight = textLines(context, repository.name, 50, width - 90, 46, 2);
  context.font = `500 27px ${siteFont}`;
  context.fillStyle = "#748579";
  context.fillText(`更新 ${date.format(repository.updatedAt)}`, 28, 50 + headingHeight);
  context.fillText("↗", width - 52, 50);
  let y = 102 + headingHeight;
  if (repository.description) {
    context.font = `500 31px ${siteFont}`;
    context.fillStyle = "#3f5548";
    y += textLines(context, repository.description, y, width - 56, 42, 2) + 18;
  }
  context.fillStyle = "#87948b";
  context.font = `500 27px ${siteFont}`;
  context.fillText("README", 28, y);
  if (readme?.status === "ready" && readme.text) {
    context.fillStyle = "#576b5d";
    context.font = `500 31px ${siteFont}`;
    textLines(context, readme.text, y + 42, width - 56, 42, 3);
  }
  return canvas;
}
