import { profile } from "../../content/profile";
import type { SiteContent } from "../../content/schema";

export interface Notice {
  title: string;
  size: readonly [number, number];
  link: { label: string; href: string };
}

export interface BoardNotice extends Notice {
  kind: "profile" | "repository" | "article";
  eyebrow: string;
  position: readonly [number, number];
  angle: number;
  ink: string;
  stock: string;
  lines: readonly string[];
}

export function boardNotices(content: SiteContent): BoardNotice[] {
  const notices: BoardNotice[] = [
    {
      kind: "profile",
      eyebrow: "PROFILE",
      title: profile.name,
      link: { label: "GitHubプロフィール", href: profile.github },
      size: [1.08, 0.43],
      position: [-0.62, 2.09],
      angle: 0.012,
      ink: "#253b31",
      stock: "#f3eee0",
      lines: [`@${profile.handle}`, profile.description],
    },
  ];
  content.repositories.forEach((repository, index) =>
    notices.push({
      kind: "repository",
      eyebrow: `GitHub / ${repository.stars} stars`,
      title: repository.name,
      link: { label: "リポジトリを開く", href: repository.url },
      size: [1.08, 0.15],
      position: [-0.62, 1.75 - index * 0.215],
      angle: index % 2 ? -0.008 : 0.008,
      ink: "#253b31",
      stock: "#f3eee0",
      lines: [],
    }),
  );
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  content.articles.forEach((article, index) =>
    notices.push({
      kind: "article",
      eyebrow: `BLOG / ${date.format(article.publishedAt)}`,
      title: article.title,
      link: { label: "この記事を読む", href: article.url },
      size: [1.08, 0.48],
      position: [0.62, 2.065 - index * 0.55],
      angle: index % 2 ? 0.012 : -0.01,
      ink: "#65442a",
      stock: "#f8f4e8",
      lines: [],
    }),
  );
  return notices;
}
