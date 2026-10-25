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
  kind: "github" | "skills" | "article";
  eyebrow: string;
  position: readonly [number, number];
  angle: number;
  ink: string;
  stock: string;
  thumbnail: ImageBitmap | null;
}

export function boardNotices(state: BoardState): BoardNotice[] {
  const notices: BoardNotice[] = [
    {
      kind: "github",
      title: "GitHubの記録",
      eyebrow: "",
      size: [1.08, 0.43],
      position: [-0.56, 2.085],
      angle: 0.012,
      ink: "#253b31",
      stock: "#f3eee0",
      thumbnail: null,
      link: { label: "GitHubを開く", href: "https://github.com/AkaakuHub" },
    },
    {
      kind: "skills",
      title: "制作分野と言語",
      eyebrow: "",
      size: [1.08, 0.97],
      position: [-0.56, 1.205],
      angle: -0.009,
      ink: "#294536",
      stock: "#f0f0e2",
      thumbnail: null,
      link: {
        label: "GitHubの制作物を見る",
        href: "https://github.com/AkaakuHub?tab=repositories",
      },
    },
  ];
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
      size: [1.08, 0.69],
      position: [0.56, 1.97 - index * 0.8],
      angle: index % 2 ? 0.012 : -0.01,
      ink: "#65442a",
      stock: "#f8f4e8",
      thumbnail,
    });
  }
  return notices;
}
