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
  roughnessMap: Texture<ImageBitmap>;
  metalnessMap: Texture<ImageBitmap> | null;
  aoMap: Texture<ImageBitmap> | null;
  alphaMap: Texture<ImageBitmap> | null;
}

export interface MaterialLibrary {
  floor: PbrMaps;
  plaster: PbrMaps;
  ash: PbrMaps;
  walnut: PbrMaps;
  fabric: PbrMaps;
  aluminum: PbrMaps;
  steel: PbrMaps;
  brass: PbrMaps;
  powder: PbrMaps;
  paper: PbrMaps;
  plastic: PbrMaps;
  leaves: PbrMaps;
}

export async function loadMaterials(renderer: WebGLRenderer): Promise<MaterialLibrary> {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  async function loadSet(
    id: string,
    meters: number,
    resolution: number,
    format: "arm" | "metal" | "dielectric" | "leaf",
  ): Promise<PbrMaps> {
    const textures = new Map<string, Promise<Texture<ImageBitmap>>>();
    async function loadMap(file: string, color: boolean, size: number) {
      const loader = new ImageBitmapLoader().setOptions({
        imageOrientation: "flipY",
        premultiplyAlpha: "none",
        colorSpaceConversion: "none",
        resizeWidth: size,
        resizeQuality: "high",
      });
      const bitmap = await loader.loadAsync(
        `${import.meta.env.BASE_URL}materials/${id}/${file}.webp`,
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
    function texture(file: string, color: boolean, size: number): Promise<Texture<ImageBitmap>> {
      let pending = textures.get(file);
      if (!pending) {
        pending = loadMap(file, color, size);
        textures.set(file, pending);
      }
      return pending;
    }
    const packed = format === "arm";
    const [map, normalMap, roughnessMap, metalnessMap, aoMap, alphaMap] = await Promise.all([
      texture("color", true, resolution),
      texture("normal", false, Math.min(512, resolution)),
      texture(packed ? "arm" : "roughness", false, 512),
      packed
        ? texture("arm", false, 512)
        : format === "metal"
          ? texture("metalness", false, 512)
          : Promise.resolve(null),
      packed ? texture("arm", false, 512) : Promise.resolve(null),
      format === "leaf" ? texture("opacity", false, 512) : Promise.resolve(null),
    ]);
    return { map, normalMap, roughnessMap, metalnessMap, aoMap, alphaMap };
  }
  const [
    floor,
    plaster,
    ash,
    walnut,
    fabric,
    aluminum,
    steel,
    brass,
    powder,
    paper,
    plastic,
    leaves,
  ] = await Promise.all([
    loadSet("herringbone_parquet", 3.4, 1024, "arm"),
    loadSet("painted_plaster_wall", 2, 512, "arm"),
    loadSet("ash_veneer", 1, 1024, "arm"),
    loadSet("walnut_veneer", 1.8, 1024, "arm"),
    loadSet("terlenka", 0.266, 512, "arm"),
    loadSet("Metal050B", 0.25, 512, "metal"),
    loadSet("Metal049B", 0.25, 512, "metal"),
    loadSet("Metal048B", 0.2, 512, "metal"),
    loadSet("Metal027", 0.1, 512, "metal"),
    loadSet("Paper001", 0.3, 512, "dielectric"),
    loadSet("Plastic010", 0.2, 512, "dielectric"),
    loadSet("LeafSet024", 1, 1024, "leaf"),
  ]);
  return {
    floor,
    plaster,
    ash,
    walnut,
    fabric,
    aluminum,
    steel,
    brass,
    powder,
    paper,
    plastic,
    leaves,
  };
}
