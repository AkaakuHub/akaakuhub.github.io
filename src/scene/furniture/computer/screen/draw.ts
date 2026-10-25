import { siteFont } from "../../../../assets/typography";
import type { BoardState } from "../../../board/notices";
import type { ReadmeState } from "../../../../content/readme";
import { screenPage } from "./layout";
import type { ScreenRegion } from "./layout";

function textLines(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  limit: number,
) {
  const lines: string[] = [];
  let line = "";
  for (const character of text.replace(/\s+/g, " ")) {
    if (context.measureText(line + character).width > width && line) {
      lines.push(line);
      line = character;
    } else line += character;
  }
  if (line) lines.push(line);
  lines.slice(0, limit).forEach((value, index) => {
    context.fillText(
      index === limit - 1 && lines.length > limit ? value.slice(0, -1) + "…" : value,
      x,
      y + index * height,
    );
  });
  return Math.min(lines.length, limit) * height;
}

export function drawScreen(
  context: CanvasRenderingContext2D,
  powered: boolean,
  state: BoardState,
  page: number,
  compact: boolean,
  readmes: ReadonlyMap<string, ReadmeState>,
): ScreenRegion[] {
  context.fillStyle = powered ? "#f6f7f2" : "#080b0a";
  context.fillRect(0, 0, 1200, 675);
  if (!powered) return [];
  const regions: ScreenRegion[] = [];
  context.fillStyle = "#23392e";
  context.font = `500 36px ${siteFont}`;
  context.fillText("AkaakuHub", 200, 64);
  context.font = `28px ${siteFont}`;
  context.fillText("← PC", 48, 63);
  context.fillText("GitHub ↗", 990, 63);
  regions.push(
    { x: 24, y: 18, width: 155, height: 70, action: { type: "back" } },
    { x: 970, y: 18, width: 206, height: 70, action: { type: "github" } },
  );
  context.fillStyle = "#d4ddd5";
  context.fillRect(48, 96, 1104, 1);
  if (state.status !== "ready") {
    context.fillStyle = "#617066";
    context.font = `32px ${siteFont}`;
    context.fillText(
      state.status === "loading" ? "読み込み中" : "一覧を取得できませんでした",
      48,
      180,
    );
    return regions;
  }
  const pagination = screenPage(page, state.content.repositories.length, compact);
  const entries = state.content.repositories.slice(
    pagination.start,
    pagination.start + pagination.size,
  );
  entries.forEach((repository, index) => {
    const top = 123 + index * 239;
    const bottom = compact ? 590 : top + 230;
    context.save();
    context.beginPath();
    context.rect(48, top, 1104, bottom - top);
    context.clip();
    context.fillStyle = "#23392e";
    context.font = `500 ${compact ? 43 : 32}px ${siteFont}`;
    context.fillText(repository.name, 48, top + 40, 900);
    context.font = `${compact ? 30 : 23}px ${siteFont}`;
    context.fillStyle = "#617066";
    context.fillText(`${repository.stars.toLocaleString("ja-JP")} stars ↗`, 990, top + 37);
    let y = top + 82;
    if (repository.description) {
      context.font = `${compact ? 35 : 26}px ${siteFont}`;
      context.fillStyle = "#52655a";
      y += textLines(context, repository.description, 48, y, 1104, compact ? 45 : 33, 2) + 12;
    }
    const readme = readmes.get(repository.name);
    if (readme?.status === "ready") {
      context.font = `${compact ? 32 : 24}px ${siteFont}`;
      context.fillStyle = "#52655a";
      textLines(
        context,
        readme.text === null ? "READMEはありません" : readme.text,
        48,
        y,
        1104,
        compact ? 43 : 31,
        compact ? 5 : 3,
      );
    }
    context.restore();
    context.fillStyle = "#d4ddd5";
    context.fillRect(48, bottom + 9, 1104, 1);
    regions.push({
      x: 48,
      y: top,
      width: 1104,
      height: bottom - top,
      action: { type: "repository", repository },
    });
  });
  context.fillStyle = "#23392e";
  context.font = `30px ${siteFont}`;
  context.fillText("← 前へ", 48, 649);
  context.fillText("次へ →", 1012, 649);
  context.textAlign = "center";
  context.fillText(`${pagination.page + 1} / ${pagination.pages}`, 600, 649);
  context.textAlign = "left";
  regions.push(
    { x: 24, y: 605, width: 190, height: 70, action: { type: "previous" } },
    { x: 986, y: 605, width: 190, height: 70, action: { type: "next" } },
  );
  return regions;
}
