import { DataTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";

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

export function textureFromCanvas(context: CanvasRenderingContext2D): DataTexture {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  return textureFromPixels(new Uint8Array(image.data.buffer), width, height);
}
