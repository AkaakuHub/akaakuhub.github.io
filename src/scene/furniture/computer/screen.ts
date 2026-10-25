import { CanvasTexture, SRGBColorSpace } from "three";
import type { MeshBasicMaterial } from "three";
import type { ContentState } from "../../../content/schema";
import type { ReadmeState } from "../../../content/readme";
import { drawScreen } from "./screen/draw";
import type { CachedCard } from "./screen/card";
import { screenHit, screenSize } from "./screen/layout";
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
  const cards = new Map<string, CachedCard>();
  let portrait = false;
  return {
    draw(
      powered: boolean,
      state: ContentState,
      offset: number,
      vertical: boolean,
      readmes: ReadonlyMap<string, ReadmeState>,
      selectedIndex: number | null,
    ): void {
      portrait = vertical;
      const size = screenSize(portrait);
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
        cards.clear();
      }
      regions = drawScreen(
        context,
        powered,
        state,
        offset,
        portrait,
        readmes,
        cards,
        selectedIndex,
      );
      texture.needsUpdate = true;
    },
    hit(u: number, v: number) {
      return screenHit(regions, u, v, portrait);
    },
    clear(name?: string) {
      if (name === undefined) cards.clear();
      else cards.delete(name);
    },
  };
}
