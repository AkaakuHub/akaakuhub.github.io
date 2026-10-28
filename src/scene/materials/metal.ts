import { MeshStandardMaterial, Vector2 } from "three";
import type { MeshStandardMaterialParameters } from "three";
import type { MaterialLibrary, MetalMaps } from "./library";
import { scannedSurface } from "./surface";
import { paintedSurface } from "./paint";

function texturedMetal(maps: MetalMaps, parameters: MeshStandardMaterialParameters) {
  return new MeshStandardMaterial({
    map: null,
    normalMap: maps.normalMap,
    roughness: 1,
    metalness: 1,
    ...parameters,
  });
}

export function createMetalMaterials(maps: MaterialLibrary) {
  const paintedMetal = (color: string) =>
    paintedSurface(maps.paint, {
      color,
    });
  return {
    aluminum: scannedSurface(maps.aluminum, {
      color: "#e6e9e7",
      metalness: 1,
      metalnessMap: maps.aluminum.roughnessMap,
    }),
    steel: texturedMetal(maps.steel, { color: "#c8cbd0", roughness: 0.42 }),
    brass: texturedMetal(maps.brass, { color: "#d8b477", roughness: 0.34 }),
    enamel: paintedMetal("#d5ddd2"),
    deepGreen: paintedMetal("#334d43"),
    ivory: paintedMetal("#e9e9df"),
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
