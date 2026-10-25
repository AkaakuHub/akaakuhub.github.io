import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import type { BoardState } from "./notices";
import type { SiteContent } from "../../content/schema";

export function createBoardLoader(update: (state: BoardState) => void) {
  let active: AbortController | undefined;
  return {
    async refresh(revoke: boolean): Promise<void> {
      active?.abort();
      const controller = new AbortController();
      active = controller;
      update({ status: "loading" });
      let content: SiteContent | undefined;
      try {
        if (revoke) await revokeSiteContent(controller.signal);
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (!content) {
              content = await loadSiteContent(controller.signal);
            }
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
