import type { PaperLink } from "./paper-links";
import type { SiteContent } from "../../content/schema";
import { profile } from "../../content/profile";

export interface Notice {
  links: readonly PaperLink[];
  refreshable: boolean;
  title: string;
  size: readonly [number, number];
  link: { label: string; href: string } | null;
}

export type BoardState =
  | { status: "loading" | "error" }
  | { status: "ready"; content: SiteContent; thumbnails: ReadonlyMap<string, ImageBitmap> };

export interface BoardNotice extends Omit<Notice, "links" | "refreshable"> {
  kind: "profile" | "github" | "article" | "privacy" | "portfolio";
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
      kind: "profile",
      title: profile.name,
      eyebrow: "",
      size: [1.08, 0.72],
      position: [-0.56, 1.895],
      angle: 0.012,
      ink: "#253b31",
      stock: "#f3eee0",
      thumbnail: null,
      link: { label: "GitHubを開く", href: profile.github },
    },
    {
      kind: "portfolio",
      title: "活動・資格",
      eyebrow: "",
      size: [1.08, 0.82],
      position: [-0.56, 1.075],
      angle: -0.009,
      ink: "#294536",
      stock: "#f0f0e2",
      thumbnail: null,
      link: null,
    },
    {
      kind: "github",
      title: "GitHubの記録",
      eyebrow: "",
      size: [1.08, 0.47],
      position: [0.56, 1.89],
      angle: -0.009,
      ink: "#294536",
      stock: "#f0f0e2",
      thumbnail: null,
      link: { label: "GitHubを開く", href: profile.github },
    },
  ];
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const article = state.status === "ready" ? state.content.articles[0] : undefined;
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
    position: [0.56, 1.09],
    angle: 0.012,
    ink: "#65442a",
    stock: "#f8f4e8",
    thumbnail,
  });
  return notices;
}
