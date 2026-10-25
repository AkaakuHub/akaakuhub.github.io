import type { Repository } from "../../../../content/schema";

export type ScreenAction =
  | { type: "back" }
  | { type: "previous" }
  | { type: "next" }
  | { type: "github" }
  | { type: "repository"; repository: Repository };
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

export function screenPage(page: number, count: number, compact: boolean) {
  const size = compact ? 1 : 2;
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.max(0, Math.min(pages - 1, page));
  return { page: current, pages, start: current * size, size };
}
