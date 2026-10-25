import type { PerspectiveCamera, Scene, Texture } from "three";
import type { Renderer } from "three/webgpu";
import { materialDefinitions } from "../../assets/materials";
import type { MetalDefinition, SurfaceDefinition } from "../../assets/materials";
import { createTextureLoader } from "./textures";
import type { RoomAssetLoader } from "../../assets/loading";
import { visibleTextures } from "./visible-textures";

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
  function required(scene: Scene, camera: PerspectiveCamera) {
    const sources = new Set([...visibleTextures(scene, camera)].map((map) => map.source));
    return [...loader.pending].filter(([map]) => sources.has(map.source) && !map.image);
  }
  const paperReady = Promise.all(
    [materials.paper.map, materials.paper.normalMap, materials.paper.roughnessMap].map((map) =>
      loader.pending.get(map)?.(),
    ),
  );
  let complete = false;
  return {
    materials,
    paperReady,
    prepareView(scene: Scene, camera: PerspectiveCamera): Promise<void> | undefined {
      if (complete) return;
      const entries = required(scene, camera);
      if (entries.length === 0) return;
      return Promise.all(entries.map(([, load]) => load())).then(() => {});
    },
    async loadRemaining(): Promise<void> {
      for (const [map, load] of loader.pending) {
        if (map.image) continue;
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        await load();
      }
      complete = true;
    },
  };
}

export type MaterialLibrary = ReturnType<typeof loadMaterials>["materials"];
