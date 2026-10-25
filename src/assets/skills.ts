import type { RoomAssetLoader } from "./loading";

export const skillAtlasAssetId = "skills/logos.webp";

export function loadSkillAtlas(assets: RoomAssetLoader): Promise<ImageBitmap> {
  return assets.load(skillAtlasAssetId, (bytes) =>
    createImageBitmap(new Blob([Uint8Array.from(bytes)], { type: "image/webp" })),
  );
}
