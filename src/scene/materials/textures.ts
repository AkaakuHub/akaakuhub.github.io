import {
  ImageBitmapLoader,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from "three";
import type { WebGLRenderer } from "three";
import { asset } from "../../assets/catalog";
import { materialAssetIds } from "../../assets/materials";

export function createTextureLoader(
  renderer: WebGLRenderer,
  progress: (completed: number, total: number) => void,
) {
  const pending = new Map<string, Promise<Texture<ImageBitmap>>>();
  const loader = new ImageBitmapLoader().setOptions({
    imageOrientation: "flipY",
    premultiplyAlpha: "none",
    colorSpaceConversion: "none",
  });
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let completed = 0;
  progress(completed, materialAssetIds.length);
  return (id: string, file: string, meters: number): Promise<Texture<ImageBitmap>> => {
    const key = `${id}/${file}`;
    let task = pending.get(key);
    if (!task) {
      task = loader.loadAsync(asset(`materials/${key}.webp`).url).then((bitmap) => {
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
        completed++;
        progress(completed, materialAssetIds.length);
        return texture;
      });
      pending.set(key, task);
    }
    return task;
  };
}
