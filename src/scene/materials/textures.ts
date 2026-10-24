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

export function createTextureLoader(renderer: WebGLRenderer, assets: RoomAssetLoader) {
  const pending = new Map<string, Promise<Texture<ImageBitmap>>>();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return (id: string, file: string, meters: number): Promise<Texture<ImageBitmap>> => {
    const key = `${id}/${file}`;
    let task = pending.get(key);
    if (!task) {
      task = assets.load(`materials/${key}.webp`, async (bytes) => {
        const bitmap = await createImageBitmap(
          new Blob([Uint8Array.from(bytes)], { type: "image/webp" }),
          {
            imageOrientation: "flipY",
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
          },
        );
        const texture = new Texture(bitmap);
        texture.name = key;
        texture.colorSpace = file === "color" ? SRGBColorSpace : NoColorSpace;
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(1 / meters, 1 / meters);
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
        renderer.initTexture(texture);
        return texture;
      });
      pending.set(key, task);
    }
    return task;
  };
}
