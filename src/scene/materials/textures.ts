import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from "three";
import type { WebGLRenderer } from "three";
import type { RoomAssetLoader } from "../../assets/loading";
import { renderingProfile } from "../quality";

export function createTextureLoader(renderer: WebGLRenderer, assets: RoomAssetLoader) {
  const textures = new Map<string, Texture<ImageBitmap | null>>();
  const pending = new Map<Texture<ImageBitmap | null>, Promise<void>>();
  const anisotropy = Math.min(
    renderingProfile().anisotropy,
    renderer.capabilities.getMaxAnisotropy(),
  );
  function texture(id: string, file: string, meters: number): Texture<ImageBitmap | null> {
    const key = `${id}/${file}`;
    const existing = textures.get(key);
    if (existing) return existing;
    const result = new Texture<ImageBitmap | null>(null);
    result.name = key;
    result.colorSpace = file === "color" ? SRGBColorSpace : NoColorSpace;
    result.wrapS = result.wrapT = RepeatWrapping;
    result.repeat.set(1 / meters, 1 / meters);
    result.magFilter = LinearFilter;
    result.minFilter = LinearMipmapLinearFilter;
    result.anisotropy = anisotropy;
    textures.set(key, result);
    pending.set(
      result,
      assets.load(`materials/${key}.webp`, async (bytes) => {
        const bitmap = await createImageBitmap(
          new Blob([Uint8Array.from(bytes)], { type: "image/webp" }),
          {
            imageOrientation: "flipY",
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
          },
        );
        result.image = bitmap;
        result.needsUpdate = true;
        renderer.initTexture(result);
      }),
    );
    return result;
  }
  return { texture, pending };
}
