import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from "three";

export function textureFromPixels(pixels: Uint8Array, width: number, height: number): DataTexture {
  const texture = new DataTexture(pixels, width, height);
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function textureFromCanvas(context: CanvasRenderingContext2D): CanvasTexture {
  const texture = new CanvasTexture(context.canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
