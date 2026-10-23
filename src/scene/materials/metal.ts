import { MeshPhysicalMaterial, Vector2 } from "three";
import type { MeshPhysicalMaterialParameters } from "three";
import type { MaterialLibrary, PbrMaps } from "./library";

function texturedMetal(maps: PbrMaps, parameters: MeshPhysicalMaterialParameters) {
  return new MeshPhysicalMaterial({
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new Vector2(0.4, 0.4),
    roughnessMap: maps.roughnessMap,
    metalnessMap: maps.metalnessMap,
    aoMap: maps.aoMap,
    roughness: 1,
    metalness: 1,
    ...parameters,
  });
}

export function createMetalMaterials(maps: MaterialLibrary) {
  return {
    aluminum: texturedMetal(maps.aluminum, { color: "#e6e9e7", roughness: 0.8 }),
    steel: texturedMetal(maps.steel, { color: "#c8cbd0", roughness: 0.85 }),
    brass: texturedMetal(maps.brass, { color: "#dbdcc9", roughness: 0.9 }),
    enamel: texturedMetal(maps.paintGreen, {
      color: "#c9dbd0",
      clearcoat: 0.3,
      clearcoatRoughness: 0.42,
      normalScale: new Vector2(0.25, 0.25),
    }),
    deepGreen: texturedMetal(maps.paintGreen, {
      color: "#8baca5",
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      normalScale: new Vector2(0.3, 0.3),
    }),
    ivory: texturedMetal(maps.aluminum, {
      color: "#dddcc8",
      metalness: 0,
      roughness: 1,
      clearcoat: 0.22,
      clearcoatRoughness: 0.5,
      normalScale: new Vector2(0.16, 0.16),
    }),
    graphite: texturedMetal(maps.powder, { metalness: 0, normalScale: new Vector2(0.4, 0.4) }),
    rubber: texturedMetal(maps.powder, {
      color: "#a8aa9f",
      metalness: 0,
      roughness: 1,
      normalScale: new Vector2(0.3, 0.3),
    }),
  };
}

export type MetalMaterials = ReturnType<typeof createMetalMaterials>;
