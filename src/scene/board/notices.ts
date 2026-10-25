import { profile } from "../../content/profile";
import type { SiteContent } from "../../content/schema";

export interface Notice {
  title: string;
  size: readonly [number, number];
  link: { label: string; href: string } | null;
}

export type BoardState =
  | { status: "loading" | "error" }
  | { status: "ready"; content: SiteContent; thumbnails: ReadonlyMap<string, ImageBitmap> };

export interface BoardNotice extends Notice {
  kind: "profile" | "repository" | "article";
  eyebrow: string;
  position: readonly [number, number];
  angle: number;
  ink: string;
  stock: string;
  lines: readonly string[];
  thumbnail: ImageBitmap | null;
}

export function boardNotices(state: BoardState): BoardNotice[] {
  const notices: BoardNotice[] = [
    {
      kind: "profile",
      eyebrow: "プロフィール",
      title: profile.name,
      link: { label: "GitHubプロフィール", href: profile.github },
      size: [1.08, 0.52],
      position: [-0.62, 2.05],
      angle: 0.012,
      ink: "#253b31",
      stock: "#f3eee0",
      lines: [`@${profile.handle}`, profile.description],
      thumbnail: null,
    },
  ];
  for (let index = 0; index < 3; index++) {
    const repository = state.status === "ready" ? state.content.repositories[index] : undefined;
    notices.push({
      kind: "repository",
      eyebrow: repository ? `GitHub / ${repository.stars} stars` : "GitHub",
      title: repository
        ? repository.name
        : state.status === "loading"
          ? "読み込み中"
          : state.status === "error"
            ? "掲示を読み直す"
            : "公開リポジトリはありません",
      link: repository ? { label: "リポジトリを開く", href: repository.url } : null,
      size: [1.08, 0.13],
      position: [-0.62, 1.68 - index * 0.19],
      angle: index % 2 ? -0.008 : 0.008,
      ink: "#253b31",
      stock: "#f3eee0",
      lines: state.status === "error" ? ["クリックして再取得"] : [],
      thumbnail: null,
    });
  }
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (let index = 0; index < 2; index++) {
    const article = state.status === "ready" ? state.content.articles[index] : undefined;
    let thumbnail: ImageBitmap | null = null;
    if (article && state.status === "ready") {
      const image = state.thumbnails.get(article.url);
      if (!image) throw new Error(`記事の画像が準備されていません: ${article.url}`);
      thumbnail = image;
    }
    notices.push({
      kind: "article",
      eyebrow: article ? date.format(article.publishedAt) : "最近の記事",
      title: article
        ? article.title
        : state.status === "loading"
          ? "読み込み中"
          : state.status === "error"
            ? "掲示を読み直す"
            : "公開記事はありません",
      link: article ? { label: "この記事を読む", href: article.url } : null,
      size: [1.08, 0.48],
      position: [0.62, 2.065 - index * 0.55],
      angle: index % 2 ? 0.012 : -0.01,
      ink: "#65442a",
      stock: "#f8f4e8",
      lines: state.status === "error" ? ["クリックして再取得"] : [],
      thumbnail,
    });
  }
  return notices;
}
