import type { Texture } from "three";

export function replaceTextureImage(
  texture: Texture<ImageBitmap | null>,
  bitmap: ImageBitmap,
): void {
  const previous = texture.image;
  texture.dispose();
  texture.image = bitmap;
  texture.needsUpdate = true;
  previous?.close();
}
