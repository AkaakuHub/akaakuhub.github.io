import type { Article } from "./schema";
import { isRecovering } from "../interface/recovery";

export async function loadArticleThumbnails(
  articles: readonly Article[],
  signal: AbortSignal,
  forceReload: boolean,
) {
  const images = await Promise.all(
    articles.map(async (article) => {
      const response = await fetch(article.thumbnail, {
        mode: "cors",
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        cache: forceReload || isRecovering() ? "reload" : "default",
      });
      if (!response.ok)
        throw new Error(
          `記事の画像を取得できませんでした: HTTP ${response.status} ${article.thumbnail}`,
        );
      const bitmap = await createImageBitmap(await response.blob(), {
        resizeWidth: 640,
        resizeHeight: 336,
        resizeQuality: "high",
      });
      return [article.url, bitmap] as const;
    }),
  );
  return new Map(images);
}
