import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from "three";
import type { RoomAssetLoader } from "../../assets/loading";
import { renderingProfile } from "../quality";
import { materialDefinitions } from "../../assets/materials";

export function createTextureLoader(assets: RoomAssetLoader) {
  const textures = new Map<string, Texture<ImageBitmap | null>>();
  const pending = new Map<Texture<ImageBitmap | null>, () => Promise<void>>();
  const refinements: (() => Promise<void>)[] = [];
  const anisotropy = renderingProfile().anisotropy;
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
    let loading: Promise<void> | undefined;
    const assetId = `materials/${key}.webp`;
    const preview = id !== materialDefinitions.paper.id;
    const options: ImageBitmapOptions = {
      imageOrientation: "none",
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    };
    pending.set(result, () => {
      loading ??= assets
        .loadImage(preview ? `preview/${assetId}` : assetId, options)
        .then((bitmap) => {
          result.image = bitmap;
          result.needsUpdate = true;
        });
      return loading;
    });
    if (preview)
      refinements.push(async () => {
        const bitmap = await assets.loadImage(assetId, options);
        const previous = result.image;
        result.image = bitmap;
        result.needsUpdate = true;
        previous?.close();
      });
    return result;
  }
  return { texture, pending, refinements };
}
