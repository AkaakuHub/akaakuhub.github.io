import type { Texture } from "three";
import type { Renderer } from "three/webgpu";
import { materialDefinitions } from "../../assets/materials";
import type { MetalDefinition, SurfaceDefinition } from "../../assets/materials";
import { createTextureLoader } from "./textures";
import type { RoomAssetLoader } from "../../assets/loading";

export interface PbrMaps {
  map: Texture<ImageBitmap | null>;
  normalMap: Texture<ImageBitmap | null>;
  roughnessMap: Texture<ImageBitmap | null>;
  aoMap: Texture<ImageBitmap | null> | null;
  alphaMap: Texture<ImageBitmap | null> | null;
}

export type MetalMaps = Pick<PbrMaps, "normalMap">;

export function loadMaterials(rendererReady: Promise<Renderer>, assets: RoomAssetLoader) {
  const loader = createTextureLoader(rendererReady, assets);
  const { texture } = loader;
  function loadSet({ id, meters, format }: SurfaceDefinition): PbrMaps {
    const packed = format === "arm";
    return {
      map: texture(id, "color", meters),
      normalMap: texture(id, "normal", meters),
      roughnessMap: texture(id, packed ? "arm" : "roughness", meters),
      aoMap: packed ? texture(id, "arm", meters) : null,
      alphaMap: format === "leaf" ? texture(id, "opacity", meters) : null,
    };
  }
  function loadMetal({ id, meters }: MetalDefinition): MetalMaps {
    const normalMap = texture(id, "normal", meters);
    return { normalMap };
  }
  const materials = {
    floor: loadSet(materialDefinitions.floor),
    plaster: loadSet(materialDefinitions.plaster),
    ash: loadSet(materialDefinitions.ash),
    walnut: loadSet(materialDefinitions.walnut),
    fabric: loadSet(materialDefinitions.fabric),
    aluminum: loadSet(materialDefinitions.aluminum),
    paint: loadSet(materialDefinitions.paint),
    steel: loadMetal(materialDefinitions.steel),
    brass: loadMetal(materialDefinitions.brass),
    powder: loadMetal(materialDefinitions.powder),
    paper: loadSet(materialDefinitions.paper),
    plastic: loadSet(materialDefinitions.plastic),
    leaves: loadSet(materialDefinitions.leaves),
  };
  const ready = Promise.all(loader.pending.values());
  const paperReady = Promise.all(
    [materials.paper.map, materials.paper.normalMap, materials.paper.roughnessMap].map((map) =>
      loader.pending.get(map),
    ),
  );
  return { materials, ready, paperReady };
}

export type MaterialLibrary = ReturnType<typeof loadMaterials>["materials"];
