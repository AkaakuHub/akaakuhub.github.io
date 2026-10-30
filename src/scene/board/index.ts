import type { PbrMaps } from "../materials/library";
import { Group } from "three";
import type { Texture } from "three";
import type { PaperPrinter } from "./printing";
import type { Object3D } from "three";
import type { PropMaterials } from "../materials/props";
import type { MetalMaterials } from "../materials/metal";
import { createFrame } from "./frame";
import { boardNotices } from "./notices";
import type { BoardState, Notice } from "./notices";
import { createPaper, updatePaper } from "./paper";
import { createBoardCredit, createBoardHeading } from "./heading";
import { addMagnets } from "./magnets";

export type { Notice } from "./notices";

export async function createBoard(
  metals: MetalMaterials,
  paperMaps: PbrMaps,
  props: PropMaterials,
  avatar: ImageBitmap,
  printer: PaperPrinter,
): Promise<{
  group: Group;
  notices: Map<Object3D, Notice>;
  contributions: ReturnType<typeof createPaper>;
  setState: (state: BoardState) => Promise<readonly Texture[]>;
}> {
  const group = createFrame(metals, props);
  group.name = "notice-board";
  group.position.z = -2.12;
  const notices = new Map<Object3D, Notice>();
  const paperSurface = {
    ...paperMaps,
    normalMap: paperMaps.normalMap.clone(),
    roughnessMap: paperMaps.roughnessMap.clone(),
  };
  paperSurface.normalMap.channel = 1;
  paperSurface.roughnessMap.channel = 1;
  let contributions: ReturnType<typeof createPaper> | undefined;
  const papers: ReturnType<typeof createPaper>[] = [];
  group.add(
    createBoardHeading("活動記録", 0.33, 2.23),
    createBoardHeading("GitHub", -0.79, 1.72),
    createBoardHeading("最新記事", -0.79, 1.13),
    createBoardCredit(),
  );
  const initial = boardNotices({ status: "loading" });
  const stock = paperMaps.map.image;
  if (!stock) throw new Error("紙の画像が準備されていません。");
  const printed = await printer.print(initial, stock, avatar);
  for (const [index, notice] of initial.entries()) {
    const print = printed[index];
    if (!print) throw new Error("掲示の印刷結果がありません。");
    const [width, height] = notice.size;
    const sheet = new Group();
    sheet.position.set(...notice.position, 0.045);
    sheet.rotation.z = notice.angle;
    const paper = createPaper(width, height, paperSurface, print);
    if (notice.kind === "github") contributions = paper;
    sheet.add(paper);
    const magnetOffset = width * (notice.kind === "profile" ? 0.34 : 0.46);
    addMagnets(sheet, magnetOffset, height, notice.ink, props);
    group.add(sheet);
    const metadata = {
      title: notice.title,
      size: notice.size,
      link: notice.link,
      links: print.links,
      refreshable: notice.kind === "article",
    };
    notices.set(paper, metadata);
    papers.push(paper);
  }
  if (!contributions) throw new Error("GitHubの掲示用紙がありません。");
  return {
    group,
    notices,
    contributions,
    async setState(state) {
      const next = boardNotices(state);
      const prints = await printer.print(
        next.filter((notice) => notice.kind === "article"),
        stock,
        avatar,
      );
      const textures: Texture[] = [];
      let articleIndex = 0;
      for (const [index, notice] of next.entries()) {
        const paper = papers[index];
        if (!paper) throw new Error("掲示の表示先がありません。");
        const metadata = notices.get(paper);
        if (!metadata) throw new Error("掲示の情報がありません。");
        metadata.title = notice.title;
        metadata.link = notice.link;
        if (notice.kind === "article") {
          const print = prints[articleIndex++];
          if (!print) throw new Error("記事の印刷結果がありません。");
          updatePaper(paper, print);
          const map = paper.material.map;
          if (!map) throw new Error("記事の画像がありません。");
          textures.push(map);
        }
      }
      return textures;
    },
  };
}
