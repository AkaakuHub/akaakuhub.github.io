export interface Notice {
  title: string;
  size: readonly [number, number];
  link: { label: string; href: string };
}

interface BoardNotice extends Notice {
  position: readonly [number, number];
  angle: number;
  ink: string;
  stock: string;
  lines: readonly string[];
}

export const boardNotices: readonly BoardNotice[] = [
  {
    title: "AkaakuHub",
    link: { label: "GitHubを開く", href: "https://github.com/AkaakuHub" },
    size: [0.65, 0.91],
    position: [-0.44, 1.72],
    angle: 0.035,
    ink: "#253b31",
    stock: "#f3eee0",
    lines: ["GitHubプロフィール"],
  },
  {
    title: "公開リポジトリ",
    link: { label: "リポジトリを見る", href: "https://github.com/AkaakuHub?tab=repositories" },
    size: [0.65, 0.91],
    position: [0.43, 1.7],
    angle: -0.025,
    ink: "#65442a",
    stock: "#f8f4e8",
    lines: ["公開しているプロジェクト"],
  },
];
