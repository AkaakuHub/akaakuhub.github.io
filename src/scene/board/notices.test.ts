import { describe, expect, it } from "vite-plus/test";
import { boardNotices } from "./notices";

const first = {
  title: "最新の記事",
  url: "https://blog.akaaku.net/posts/first",
  publishedAt: 2,
  thumbnail: "https://blog.akaaku.net/og/posts/first.png",
};
const second = {
  title: "前の記事",
  url: "https://blog.akaaku.net/posts/second",
  publishedAt: 1,
  thumbnail: "https://blog.akaaku.net/og/posts/second.png",
};

describe("ホワイトボードの掲示", () => {
  it("左にプロフィール・草・最新記事、右に活動記録を置き、紙が重ならない", () => {
    const notices = boardNotices({ status: "loading" });
    expect(notices.map((notice) => notice.kind)).toEqual([
      "profile",
      "github",
      "article",
      "portfolio",
    ]);
    for (const notice of notices) {
      expect(Math.sign(notice.position[0])).toBe(notice.kind === "portfolio" ? 1 : -1);
      for (const other of notices) {
        if (notice === other) continue;
        const overlapX =
          Math.abs(notice.position[0] - other.position[0]) < (notice.size[0] + other.size[0]) / 2;
        const overlapY =
          Math.abs(notice.position[1] - other.position[1]) < (notice.size[1] + other.size[1]) / 2;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it("取得結果に複数の記事があっても最新1件だけ掲示する", () => {
    const bitmap: ImageBitmap = { width: 640, height: 336, close() {} };
    const notices = boardNotices({
      status: "ready",
      content: { articles: [first, second] },
      thumbnails: new Map([[first.url, bitmap]]),
    });
    const articles = notices.filter((notice) => notice.kind === "article");
    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toBe(first.title);
    expect(articles[0]?.thumbnail).toBe(bitmap);
    expect(articles[0]?.link?.href).toBe(first.url);
  });
});
