import type { Texture, WebGLRenderer } from "three";
import { materialDefinitions } from "../../assets/materials";
import type { MetalDefinition, SurfaceDefinition } from "../../assets/materials";
import { createTextureLoader } from "./textures";
import type { RoomAssetLoader } from "../../assets/loading";

export interface PbrMaps {
  map: Texture<ImageBitmap>;
  normalMap: Texture<ImageBitmap>;
  roughnessMap: Texture<ImageBitmap>;
  aoMap: Texture<ImageBitmap> | null;
  alphaMap: Texture<ImageBitmap> | null;
}

export type MetalMaps = Pick<PbrMaps, "normalMap">;

export async function loadMaterials(renderer: WebGLRenderer, assets: RoomAssetLoader) {
  const texture = createTextureLoader(renderer, assets);
  async function loadSet({ id, meters, format }: SurfaceDefinition): Promise<PbrMaps> {
    const packed = format === "arm";
    const [map, normalMap, roughnessMap, aoMap, alphaMap] = await Promise.all([
      texture(id, "color", meters),
      texture(id, "normal", meters),
      texture(id, packed ? "arm" : "roughness", meters),
      packed ? texture(id, "arm", meters) : Promise.resolve(null),
      format === "leaf" ? texture(id, "opacity", meters) : Promise.resolve(null),
    ]);
    return { map, normalMap, roughnessMap, aoMap, alphaMap };
  }
  async function loadMetal({ id, meters }: MetalDefinition): Promise<MetalMaps> {
    const normalMap = await texture(id, "normal", meters);
    return { normalMap };
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
    loadSet(materialDefinitions.floor),
    loadSet(materialDefinitions.plaster),
    loadSet(materialDefinitions.ash),
    loadSet(materialDefinitions.walnut),
    loadSet(materialDefinitions.fabric),
    loadMetal(materialDefinitions.aluminum),
    loadMetal(materialDefinitions.steel),
    loadMetal(materialDefinitions.brass),
    loadMetal(materialDefinitions.powder),
    loadSet(materialDefinitions.paper),
    loadSet(materialDefinitions.plastic),
    loadSet(materialDefinitions.leaves),
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

export type MaterialLibrary = Awaited<ReturnType<typeof loadMaterials>>;
