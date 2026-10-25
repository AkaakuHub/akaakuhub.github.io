import { MeshPhysicalMaterial, Vector2 } from "three";
import type { MeshPhysicalMaterialParameters } from "three";
import type { MaterialLibrary, MetalMaps } from "./library";
import { physicalSurface } from "./surface";

function texturedMetal(maps: MetalMaps, parameters: MeshPhysicalMaterialParameters) {
  return new MeshPhysicalMaterial({
    map: null,
    normalMap: maps.normalMap,
    normalScale: new Vector2(0.08, 0.08),
    roughness: 1,
    metalness: 1,
    ...parameters,
  });
}

export function createMetalMaterials(maps: MaterialLibrary) {
  return {
    aluminum: physicalSurface(maps.aluminum, {
      color: "#e6e9e7",
      metalness: 1,
      metalnessMap: maps.aluminum.roughnessMap,
      normalScale: new Vector2(0.08, 0.08),
    }),
    steel: texturedMetal(maps.steel, { color: "#c8cbd0", roughness: 0.42 }),
    brass: texturedMetal(maps.brass, { color: "#d8b477", roughness: 0.34 }),
    enamel: physicalSurface(maps.paint, {
      color: "#d5ddd2",
      metalness: 0,
      roughness: 1,
      normalScale: new Vector2(0.16, 0.16),
    }),
    deepGreen: physicalSurface(maps.paint, {
      color: "#334d43",
      metalness: 0,
      roughness: 1,
      normalScale: new Vector2(0.14, 0.14),
    }),
    ivory: physicalSurface(maps.paint, {
      color: "#e9e9df",
      metalness: 0,
      roughness: 1,
      normalScale: new Vector2(0.12, 0.12),
    }),
    graphite: texturedMetal(maps.powder, {
      color: "#303431",
      metalness: 0,
      roughness: 0.78,
      normalScale: new Vector2(0.12, 0.12),
    }),
    rubber: texturedMetal(maps.powder, {
      color: "#272c29",
      metalness: 0,
      roughness: 1,
      normalScale: new Vector2(0.3, 0.3),
    }),
  };
}

export type MetalMaterials = ReturnType<typeof createMetalMaterials>;
