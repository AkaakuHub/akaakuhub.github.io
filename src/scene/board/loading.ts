import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import type { BoardState } from "./notices";
import type { SiteContent } from "../../content/schema";

export function createBoardLoader(update: (state: BoardState) => Promise<void>) {
  let active: AbortController | undefined;
  let initial: Promise<BoardState> | undefined;
  async function prepare(): Promise<BoardState> {
    const controller = new AbortController();
    try {
      const content = await loadSiteContent(controller.signal);
      const thumbnails = await loadArticleThumbnails(
        content.articles.slice(0, 1),
        controller.signal,
        false,
      );
      return { status: "ready", content, thumbnails };
    } catch {
      return { status: "error" };
    }
  }
  return {
    preload(): void {
      initial ??= prepare();
    },
    async refresh(revoke: boolean): Promise<void> {
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const prefetched = initial;
      initial = undefined;
      if (revoke && prefetched)
        void prefetched.then((state) => {
          if (state.status === "ready")
            for (const bitmap of state.thumbnails.values()) bitmap.close();
        });
      if (controller.signal.aborted) return;
      if (revoke) await update({ status: "loading" });
      let content: SiteContent | undefined;
      try {
        if (revoke) await revokeSiteContent(controller.signal);
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const prepared = !revoke && attempt === 0 ? await prefetched : undefined;
            if (prepared?.status === "ready") content = prepared.content;
            if (!content) {
              content = await loadSiteContent(controller.signal);
            }
            const thumbnails =
              prepared?.status === "ready"
                ? prepared.thumbnails
                : await loadArticleThumbnails(
                    content.articles.slice(0, 1),
                    controller.signal,
                    revoke || attempt > 0,
                  );
            try {
              if (!controller.signal.aborted)
                await update({ status: "ready", content, thumbnails });
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
      if (!controller.signal.aborted) await update({ status: "error" });
    },
  };
}
