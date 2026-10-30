import type { Material } from "three";

export const noticeSurface = "notice-surface";

export function noticeMaterial<T extends Material>(material: T): T {
  material.name = noticeSurface;
  material.customProgramCacheKey = () => noticeSurface;
  return material;
}

export function noticeLightScale(material: string, source: "sun" | "sky" | "lamp"): number {
  return material === noticeSurface && source === "sun" ? 0.03 : 1;
}
