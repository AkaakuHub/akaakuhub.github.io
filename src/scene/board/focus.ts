import type { Group, Mesh } from "three";
import type { PbrMaps } from "../materials/library";
import { boardNotices } from "./notices";
import type { Notice } from "./notices";
import { updatePaper } from "./paper";
import type { createPaper } from "./paper";

export interface BoardSheet {
  sheet: Group;
  paper: ReturnType<typeof createPaper>;
  magnets: readonly Mesh[];
  notice: Notice;
}

export function createBoardFocus(sheets: readonly BoardSheet[], maps: PbrMaps, atlas: ImageBitmap) {
  let active: number | null = null;
  return (index: number | null, aspect: number): boolean => {
    const next = aspect < 1 && (index === 0 || index === 1) ? index : null;
    if (next === active) return false;
    active = next;
    for (const [slot, print] of boardNotices({ status: "loading" }).entries()) {
      if (slot > 1) break;
      const target = sheets[slot];
      if (!target) throw new Error("掲示用紙の配置が見つかりません。");
      const focused = slot === active;
      print.size = [1.08, focused ? (slot === 0 ? 0.72 : 1.22) : 0.43];
      target.notice.size = print.size;
      target.sheet.position.set(
        print.position[0],
        focused && slot === 1 ? 1.72 : print.position[1],
        focused ? 0.15 : 0.045,
      );
      for (const magnet of target.magnets) magnet.position.y = print.size[1] / 2 - 0.035;
      updatePaper(target.paper, print, maps, atlas);
    }
    return true;
  };
}
