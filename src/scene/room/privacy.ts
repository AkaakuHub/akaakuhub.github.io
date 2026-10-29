import { Group } from "three";
import type { PbrMaps } from "../materials/library";
import type { PropMaterials } from "../materials/props";
import type { PaperPrinter } from "../board/printing";
import { createPaper } from "../board/paper";
import { addMagnets } from "../board/magnets";
import { privacy } from "../../content/privacy";
import type { InspectionTarget } from "../view/targets";

export async function createPrivacyPoster(
  maps: PbrMaps,
  props: PropMaterials,
  avatar: ImageBitmap,
  printer: PaperPrinter,
) {
  const stock = maps.map.image;
  if (!stock) throw new Error("ポリシー用の紙の画像がありません。");
  const width = 0.68;
  const height = 1.0;
  const [print] = await printer.print(
    [
      {
        kind: "privacy",
        title: privacy.title,
        size: [width, height],
        link: null,
        eyebrow: "",
        position: [0, 0],
        angle: 0,
        ink: "#253b31",
        stock: "#f3eee0",
        thumbnail: null,
      },
    ],
    stock,
    avatar,
  );
  if (!print) throw new Error("ポリシーの印刷結果がありません。");
  const paper = createPaper(width, height, maps, print);
  paper.name = "privacy-policy";
  const group = new Group();
  group.position.set(0, 1.65, 2.575);
  group.rotation.y = Math.PI;
  group.add(paper);
  addMagnets(group, width * 0.4, height, "#53634f", props);
  const target: InspectionTarget = {
    object: paper,
    width: width + 0.04,
    height: height + 0.04,
    depth: 0,
    offsetY: 0,
    topAligned: false,
  };
  return { group, target };
}
