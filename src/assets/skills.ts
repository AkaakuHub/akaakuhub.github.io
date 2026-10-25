import type { RoomAssetLoader } from "./loading";

export const skillAtlasAssetId = "skills/logos.webp";

export function loadSkillAtlas(assets: RoomAssetLoader): Promise<ImageBitmap> {
  return assets.loadImage(skillAtlasAssetId, {});
}
