import { Group, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Object3D } from "three";
import { box, surface } from "../primitives";
import { paperTexture } from "./paper";

export interface Notice {
  title: string;
  body: string;
  link?: { label: string; href: string };
}

export function createBoard(): { group: Group; notices: Map<Object3D, Notice> } {
  const group = new Group();
  const notices = new Map<Object3D, Notice>();
  const metal = surface("#a8adab", 0.32, 0.8);
  box(group, [3.25, 1.57, 0.055], [0, 1.81, -2.48], metal);
  box(
    group,
    [3.16, 1.48, 0.025],
    [0, 1.81, -2.44],
    new MeshPhysicalMaterial({
      color: "#e5ebe2",
      roughness: 0.27,
      clearcoat: 0.65,
      clearcoatRoughness: 0.25,
    }),
  );
  box(group, [3.24, 0.035, 0.15], [0, 1.035, -2.4], metal);
  const eraser = box(group, [0.18, 0.045, 0.065], [1.12, 1.08, -2.39], surface("#3b504d"));
  eraser.rotation.y = 0.12;
  for (let index = 0; index < 3; index++) {
    box(
      group,
      [0.13, 0.018, 0.018],
      [0.7 - index * 0.18, 1.065, -2.37],
      surface(index === 0 ? "#ac493a" : "#293e46"),
    );
  }
  const entries = [
    {
      x: -0.97,
      y: 1.86,
      angle: -0.035,
      color: "#b85d45",
      title: "AkaakuHub",
      lines: ["GitHub", "AkaakuHub", "", "プロフィール"],
      body: "AkaakuHubのトップサイトです。部室のホワイトボードから、公開しているプロジェクトを見に行けます。",
      link: { label: "GitHubを開く", href: "https://github.com/AkaakuHub" },
    },
    {
      x: -0.17,
      y: 1.89,
      angle: 0.025,
      color: "#456761",
      title: "つくったもの",
      lines: ["公開リポジトリ", "", "GitHub", "AkaakuHub"],
      body: "公開リポジトリはGitHubにまとめています。",
      link: { label: "リポジトリを見る", href: "https://github.com/AkaakuHub?tab=repositories" },
    },
    {
      x: 0.91,
      y: 1.68,
      angle: -0.065,
      color: "#927543",
      title: "部室のこと",
      lines: ["5.2 × 5.2m", "木の床と白い壁", "", "制作中"],
      body: "木の床、窓際の机、棚とロッカーを置いた部室です。4方向の固定視点で見回せます。ドアの外の空間は制作前です。",
    },
  ];
  for (const entry of entries) {
    const paper = box(
      group,
      [0.64, 0.86, 0.008],
      [entry.x, entry.y, -2.413],
      new MeshStandardMaterial({
        map: paperTexture(entry.title, entry.lines, entry.color),
        roughness: 0.95,
      }),
    );
    paper.rotation.z = entry.angle;
    notices.set(paper, {
      title: entry.title,
      body: entry.body,
      ...(entry.link ? { link: entry.link } : {}),
    });
    const magnet = box(
      group,
      [0.065, 0.035, 0.025],
      [entry.x, entry.y + 0.38, -2.388],
      surface(entry.color, 0.35),
    );
    magnet.rotation.z = entry.angle;
  }
  return { group, notices };
}
