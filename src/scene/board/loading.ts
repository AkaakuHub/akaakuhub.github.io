import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import { prepareBoardFont } from "../../assets/typography";
import type { BoardState } from "./notices";

export function createBoardLoader(update: (state: BoardState) => void) {
  let active: AbortController | undefined;
  return {
    async refresh(revoke: boolean): Promise<void> {
      active?.abort();
      const controller = new AbortController();
      active = controller;
      update({ status: "loading" });
      try {
        if (revoke) await revokeSiteContent(controller.signal);
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const content = await loadSiteContent(controller.signal);
            await prepareBoardFont(
              [
                ...content.repositories
                  .slice(0, 3)
                  .flatMap((entry) => [entry.name, entry.description ?? ""]),
                ...content.articles.map((entry) => entry.title),
              ].join(" "),
            );
            const thumbnails = await loadArticleThumbnails(
              content.articles,
              controller.signal,
              revoke || attempt > 0,
            );
            try {
              if (!controller.signal.aborted) update({ status: "ready", content, thumbnails });
            } finally {
              for (const bitmap of thumbnails.values()) bitmap.close();
            }
            return;
          } catch (error) {
            if (controller.signal.aborted) return;
            console.error(error);
            if (attempt < 2)
              await new Promise<void>((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
          }
          if (controller.signal.aborted) return;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
      }
      if (!controller.signal.aborted) update({ status: "error" });
    },
  };
}
