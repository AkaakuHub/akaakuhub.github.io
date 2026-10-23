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

export interface PbrMaps {
  map: Texture<ImageBitmap>;
  normalMap: Texture<ImageBitmap>;
  arm: Texture<ImageBitmap>;
}

export interface MaterialLibrary {
  floor: PbrMaps;
  plaster: PbrMaps;
  ash: PbrMaps;
  walnut: PbrMaps;
  fabric: PbrMaps;
  metal: PbrMaps;
}

export async function loadMaterials(renderer: WebGLRenderer): Promise<MaterialLibrary> {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  async function loadSet(id: string, meters: number, resolution: number): Promise<PbrMaps> {
    async function loadMap(file: string, color: boolean, size: number) {
      const loader = new ImageBitmapLoader().setOptions({
        imageOrientation: "flipY",
        premultiplyAlpha: "none",
        colorSpaceConversion: "none",
        resizeWidth: size,
        resizeHeight: size,
        resizeQuality: "high",
      });
      const bitmap = await loader.loadAsync(
        `${import.meta.env.BASE_URL}materials/${id}/${file}.jpg`,
      );
      const texture = new Texture(bitmap);
      texture.name = `${id}/${file}`;
      texture.colorSpace = color ? SRGBColorSpace : NoColorSpace;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(1 / meters, 1 / meters);
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
      return texture;
    }
    const [map, normalMap, arm] = await Promise.all([
      loadMap("color", true, resolution),
      loadMap("normal", false, resolution),
      loadMap("arm", false, 512),
    ]);
    return { map, normalMap, arm };
  }
  const [floor, plaster, ash, walnut, fabric, metal] = await Promise.all([
    loadSet("herringbone_parquet", 3.4, 1024),
    loadSet("painted_plaster_wall", 2, 512),
    loadSet("ash_veneer", 1, 1024),
    loadSet("walnut_veneer", 1.8, 1024),
    loadSet("terlenka", 0.266, 512),
    loadSet("blue_metal_plate", 2.5, 512),
  ]);
  return { floor, plaster, ash, walnut, fabric, metal };
}
