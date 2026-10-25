import type { Repository } from "../../../../content/schema";

export type ScreenAction = { type: "github" } | { type: "repository"; repository: Repository };
export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  action: ScreenAction;
}

export function screenHit(
  regions: readonly ScreenRegion[],
  u: number,
  v: number,
): ScreenAction | undefined {
  const x = u * 1200;
  const y = (1 - v) * 675;
  return regions.find(
    (region) =>
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height,
  )?.action;
}

export function screenLayout(count: number, offset: number, compact: boolean) {
  const top = 205;
  const height = compact ? 408 : 330;
  const contentHeight = top + count * height + 40;
  const maximum = Math.max(0, contentHeight - 675);
  const scroll = Math.max(0, Math.min(maximum, offset));
  return {
    top,
    height,
    contentHeight,
    maximum,
    offset: scroll,
    start: Math.max(0, Math.min(count, Math.floor((scroll - top) / height))),
    end: Math.max(0, Math.min(count, Math.ceil((scroll + 675 - top) / height))),
  };
}
