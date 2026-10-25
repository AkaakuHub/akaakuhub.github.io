import type { PbrMaps } from "../materials/library";
import { Group } from "three";
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

export function createBoard(
  metals: MetalMaterials,
  paperMaps: PbrMaps,
  props: PropMaterials,
  skillAtlas: ImageBitmap,
): {
  group: Group;
  notices: Map<Object3D, Notice>;
  contributions: ReturnType<typeof createPaper>;
  setState: (state: BoardState) => void;
} {
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
    createBoardHeading("GitHub", -0.79, 2.275),
    createBoardHeading("Skills", -0.79, 1.69),
    createBoardHeading("最新記事", 0.33, 2.275),
    createBoardCredit(),
  );
  for (const notice of boardNotices({ status: "loading" })) {
    const [width, height] = notice.size;
    const sheet = new Group();
    sheet.position.set(...notice.position, 0.045);
    sheet.rotation.z = notice.angle;
    const paper = createPaper(width, height, notice, paperSurface, skillAtlas);
    if (notice.kind === "github") contributions = paper;
    sheet.add(paper);
    const magnetOffset = width * (notice.kind === "skills" ? 0.34 : 0.46);
    addMagnets(sheet, magnetOffset, height, notice.ink, props);
    group.add(sheet);
    const metadata = { title: notice.title, size: notice.size, link: notice.link };
    notices.set(paper, metadata);
    papers.push(paper);
  }
  if (!contributions) throw new Error("GitHubの掲示用紙がありません。");
  return {
    group,
    notices,
    contributions,
    setState(state): void {
      boardNotices(state).forEach((notice, index) => {
        const paper = papers[index];
        if (!paper) throw new Error("掲示の表示先がありません。");
        const metadata = notices.get(paper);
        if (!metadata) throw new Error("掲示の情報がありません。");
        metadata.title = notice.title;
        metadata.link = notice.link;
        if (notice.kind === "article") updatePaper(paper, notice, paperMaps, skillAtlas);
      });
    },
  };
}
