import { siteFont } from "../../../../assets/typography";
import type { ContentState } from "../../../../content/schema";
import type { ReadmeState } from "../../../../content/readme";
import { screenLayout } from "./layout";
import type { ScreenRegion } from "./layout";

import { drawRepositoryCard } from "./card";
import type { CachedCard } from "./card";

export function drawScreen(
  context: CanvasRenderingContext2D,
  powered: boolean,
  state: ContentState,
  offset: number,
  portrait: boolean,
  readmes: ReadonlyMap<string, ReadmeState>,
  cards: Map<string, CachedCard>,
  selectedIndex: number | null,
): ScreenRegion[] {
  const repositories = state.status === "ready" ? state.content.repositories : [];
  const layout = screenLayout(repositories.length, offset, portrait);
  const { width, height } = layout.viewport;
  const { margin } = layout;
  context.fillStyle = powered ? "#f2f5f1" : "#080b0a";
  context.fillRect(0, 0, width, height);
  if (!powered) return [];
  const regions: ScreenRegion[] = [];
  context.save();
  context.translate(0, -layout.offset);
  context.fillStyle = "#536b5b";
  context.font = `500 27px ${siteFont}`;
  context.textAlign = "right";
  context.fillText("GitHubで見る ↗", width - margin, 44);
  context.textAlign = "left";
  context.fillStyle = "#203d30";
  context.font = `500 ${portrait ? 44 : 50}px ${siteFont}`;
  context.fillText("リポジトリ", margin, portrait ? 100 : 126);
  context.font = `500 27px ${siteFont}`;
  context.fillStyle = "#748579";
  context.fillText("AkaakuHub / 更新順", margin, portrait ? 143 : 169);
  regions.push({
    x: width - margin - 260,
    y: -layout.offset,
    width: 260,
    height: 65,
    action: { type: "github" },
  });
  if (state.status !== "ready") {
    context.font = `500 30px ${siteFont}`;
    context.fillText(
      state.status === "loading" ? "読み込み中" : "一覧を取得できませんでした",
      margin,
      260,
    );
  } else {
    for (let index = layout.start; index < layout.end; index++) {
      const repository = repositories[index];
      if (!repository) continue;
      const readme = readmes.get(repository.name);
      let cached = cards.get(repository.name);
      if (
        !cached ||
        cached.repository !== repository ||
        cached.readme !== readme ||
        cached.portrait !== portrait
      ) {
        cached = {
          repository,
          readme,
          portrait,
          canvas: drawRepositoryCard(repository, readme, layout.height, layout.cardWidth),
        };
        cards.set(repository.name, cached);
        if (cards.size > 12) {
          const oldest = cards.keys().next().value;
          if (oldest !== undefined) cards.delete(oldest);
        }
      }
      const y = layout.top + index * layout.height;
      context.drawImage(cached.canvas, margin, y);
      if (index === selectedIndex) {
        context.strokeStyle = "#245f49";
        context.lineWidth = 5;
        context.strokeRect(margin + 2.5, y + 2.5, layout.cardWidth - 5, layout.height - 25);
      }
      regions.push({
        x: margin,
        y: y - layout.offset,
        width: layout.cardWidth,
        height: layout.height - 20,
        action: { type: "repository", repository },
      });
    }
  }
  context.restore();
  if (layout.maximum > 0) {
    const trackHeight = height - 28;
    const thumb = Math.max(36, (trackHeight * height) / layout.contentHeight);
    const top = 14 + ((trackHeight - thumb) * layout.offset) / layout.maximum;
    context.fillStyle = "#8ba09355";
    context.beginPath();
    context.roundRect(width - 16, top, 6, thumb, 3);
    context.fill();
  }
  return regions;
}
