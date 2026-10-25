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
  compact: boolean,
  readmes: ReadonlyMap<string, ReadmeState>,
  cards: Map<string, CachedCard>,
  selectedIndex: number | null,
): ScreenRegion[] {
  context.fillStyle = powered ? "#f2f5f1" : "#080b0a";
  context.fillRect(0, 0, 1200, 675);
  if (!powered) return [];
  const repositories = state.status === "ready" ? state.content.repositories : [];
  const layout = screenLayout(repositories.length, offset, compact);
  const regions: ScreenRegion[] = [];
  context.save();
  context.translate(0, -layout.offset);
  context.fillStyle = "#536b5b";
  context.font = `500 25px ${siteFont}`;
  context.fillText("GitHubで見る ↗", 930, 52);
  context.fillStyle = "#203d30";
  context.font = `500 50px ${siteFont}`;
  context.fillText("リポジトリ", 52, 126);
  context.font = `500 24px ${siteFont}`;
  context.fillStyle = "#748579";
  context.fillText("AkaakuHub / 更新順", 55, 169);
  regions.push({
    x: 900,
    y: 12 - layout.offset,
    width: 260,
    height: 65,
    action: { type: "github" },
  });
  if (state.status !== "ready") {
    context.font = `500 30px ${siteFont}`;
    context.fillText(
      state.status === "loading" ? "読み込み中" : "一覧を取得できませんでした",
      52,
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
        cached.compact !== compact
      ) {
        cached = {
          repository,
          readme,
          compact,
          canvas: drawRepositoryCard(repository, readme, compact, layout.height),
        };
        cards.set(repository.name, cached);
        if (cards.size > 12) {
          const oldest = cards.keys().next().value;
          if (oldest !== undefined) cards.delete(oldest);
        }
      }
      const y = layout.top + index * layout.height;
      context.drawImage(cached.canvas, 52, y);
      if (index === selectedIndex) {
        context.strokeStyle = "#245f49";
        context.lineWidth = 5;
        context.strokeRect(54.5, y + 2.5, 1091, layout.height - 25);
      }
      regions.push({
        x: 52,
        y: y - layout.offset,
        width: 1096,
        height: layout.height - 20,
        action: { type: "repository", repository },
      });
    }
  }
  context.restore();
  if (layout.maximum > 0) {
    const thumb = Math.max(36, (647 * 675) / layout.contentHeight);
    const top = 14 + ((647 - thumb) * layout.offset) / layout.maximum;
    context.fillStyle = "#8ba09355";
    context.beginPath();
    context.roundRect(1176, top, 6, thumb, 3);
    context.fill();
  }
  return regions;
}
