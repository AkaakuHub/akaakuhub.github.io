import type { Object3D } from "three";
import type { Notice } from "../board";
import type { InspectionTarget } from "./targets";

export function boardInspections(notices: ReadonlyMap<Object3D, Notice>): InspectionTarget[] {
  return [...notices].map(([object, notice], index) => ({
    object,
    width: notice.size[0] + 0.04,
    height: notice.size[1] + (index === 2 || index === 3 ? 0.16 : 0.04),
    depth: 0,
    offsetY: index === 2 || index === 3 ? 0.06 : 0,
    topAligned: false,
  }));
}
