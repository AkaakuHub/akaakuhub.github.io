import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import { prepareBoardFont } from "../../assets/typography";
import type { BoardState } from "./notices";
import { loadContributions } from "../../content/contributions";
import type { ContributionState } from "../../content/contributions";

export function createBoardLoader(
  update: (state: BoardState) => void,
  updateContributions: (state: ContributionState) => void,
) {
  let active: AbortController | undefined;
  async function refreshContributions(signal: AbortSignal): Promise<void> {
    updateContributions({ status: "loading" });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const image = await loadContributions(signal);
        if (!signal.aborted) updateContributions({ status: "ready", image });
        return;
      } catch (error) {
        if (signal.aborted) return;
        console.error(error);
        if (attempt < 2)
          await new Promise<void>((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      }
      if (signal.aborted) return;
    }
    updateContributions({ status: "error" });
  }
  return {
    async refresh(revoke: boolean): Promise<void> {
      active?.abort();
      const controller = new AbortController();
      active = controller;
      update({ status: "loading" });
      try {
        if (revoke) await revokeSiteContent(controller.signal);
        void refreshContributions(controller.signal);
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const content = await loadSiteContent(controller.signal);
            await prepareBoardFont(
              [
                ...content.repositories.map((entry) => entry.name),
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
