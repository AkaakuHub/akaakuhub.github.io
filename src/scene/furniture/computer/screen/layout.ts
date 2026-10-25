import type { Repository } from "../../../../content/schema";

export type ScreenAction = { type: "github" } | { type: "repository"; repository: Repository };
export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  action: ScreenAction;
}

export function screenSize(portrait: boolean) {
  return { width: portrait ? 675 : 1200, height: portrait ? 1200 : 675 };
}

export function screenHit(
  regions: readonly ScreenRegion[],
  u: number,
  v: number,
  portrait: boolean,
): ScreenAction | undefined {
  const size = screenSize(portrait);
  const x = u * size.width;
  const y = (1 - v) * size.height;
  return regions.find(
    (region) =>
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height,
  )?.action;
}

export function screenLayout(count: number, offset: number, portrait: boolean) {
  const viewport = screenSize(portrait);
  const margin = portrait ? 28 : 52;
  const top = portrait ? 172 : 205;
  const height = portrait ? 560 : 480;
  const contentHeight = top + count * height + 40;
  const maximum = Math.max(0, contentHeight - viewport.height);
  const scroll = Math.max(0, Math.min(maximum, offset));
  return {
    top,
    height,
    viewport,
    margin,
    cardWidth: viewport.width - margin * 2,
    contentHeight,
    maximum,
    offset: scroll,
    start: Math.max(0, Math.min(count, Math.floor((scroll - top) / height))),
    end: Math.max(0, Math.min(count, Math.ceil((scroll + viewport.height - top) / height))),
  };
}
