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
    brass: texturedMetal(maps.brass, { color: "#dbdcc9", roughness: 0.4 }),
    enamel: physicalSurface(maps.paint, {
      color: "#bfc9bd",
      metalness: 1,
      metalnessMap: maps.paint.roughnessMap,
      clearcoat: 0.3,
      clearcoatRoughness: 0.42,
      normalScale: new Vector2(0.25, 0.25),
    }),
    deepGreen: physicalSurface(maps.paint, {
      color: "#334d43",
      metalness: 1,
      metalnessMap: maps.paint.roughnessMap,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      normalScale: new Vector2(0.3, 0.3),
    }),
    ivory: physicalSurface(maps.paint, {
      color: "#dddcc8",
      metalness: 1,
      metalnessMap: maps.paint.roughnessMap,
      roughness: 1,
      clearcoat: 0.22,
      clearcoatRoughness: 0.5,
      normalScale: new Vector2(0.16, 0.16),
    }),
    graphite: texturedMetal(maps.powder, {
      color: "#303431",
      metalness: 0,
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
