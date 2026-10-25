import { CanvasTexture, SRGBColorSpace } from "three";
import type { MeshBasicMaterial } from "three";
import type { BoardState } from "../../board/notices";
import type { ReadmeState } from "../../../content/readme";
import { drawScreen } from "./screen/draw";
import { screenHit } from "./screen/layout";
import type { ScreenRegion } from "./screen/layout";

export function createComputerScreen(material: MeshBasicMaterial) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("モニターを描画できませんでした。");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  material.map = texture;
  material.color.set("#bfc7c0");
  material.needsUpdate = true;
  let regions: ScreenRegion[] = [];
  return {
    draw(
      powered: boolean,
      state: BoardState,
      page: number,
      compact: boolean,
      readmes: ReadonlyMap<string, ReadmeState>,
    ): void {
      regions = drawScreen(context, powered, state, page, compact, readmes);
      texture.needsUpdate = true;
    },
    hit(u: number, v: number) {
      return screenHit(regions, u, v);
    },
  };
}
