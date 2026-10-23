export interface Notice {
  title: string;
  body: string;
  link?: { label: string; href: string };
}

interface BoardNotice extends Notice {
  size: readonly [number, number];
  position: readonly [number, number];
  angle: number;
  ink: string;
  stock: string;
  lines: readonly string[];
}

export const boardNotices: readonly BoardNotice[] = [
  {
    title: "AkaakuHub",
    body: "AkaakuHubのGitHubプロフィールです。",
    link: { label: "GitHubを開く", href: "https://github.com/AkaakuHub" },
    size: [0.65, 0.91],
    position: [-0.67, 1.72],
    angle: 0.035,
    ink: "#415e58",
    stock: "#f3eee0",
    lines: ["GitHubプロフィール", "github.com/AkaakuHub"],
  },
  {
    title: "公開リポジトリ",
    body: "AkaakuHubが公開しているリポジトリをGitHubで開きます。",
    link: { label: "リポジトリを見る", href: "https://github.com/AkaakuHub?tab=repositories" },
    size: [1.02, 0.68],
    position: [0.42, 1.67],
    angle: -0.025,
    ink: "#a36d3f",
    stock: "#f8f4e8",
    lines: ["GitHub / AkaakuHub", "github.com/AkaakuHub"],
  },
];
