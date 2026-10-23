import { MeshPhysicalMaterial, Vector2 } from "three";
import type { MaterialLibrary } from "../materials/library";
import { physicalSurface, scannedSurface } from "../materials/surface";
import type { MetalMaterials } from "../materials/metal";
import { createPropMaterials } from "./materials/props";

export function createFurnitureMaterials(maps: MaterialLibrary, metals: MetalMaterials) {
  return {
    ash: scannedSurface(maps.ash),
    walnut: scannedSurface(maps.walnut),
    amber: physicalSurface(maps.ash, {
      color: "#d7b07a",
      roughness: 0.75,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
    }),
    ivory: metals.ivory,
    enamel: metals.enamel,
    deepGreen: metals.deepGreen,
    metal: metals.steel,
    brass: metals.brass,
    graphite: metals.graphite,
    rubber: metals.rubber,
    ...createPropMaterials(maps),
    glass: new MeshPhysicalMaterial({
      color: "#dce9df",
      roughness: 0.065,
      roughnessMap: maps.plastic.roughnessMap,
      normalMap: maps.plastic.normalMap,
      normalScale: new Vector2(0.025, 0.025),
      metalness: 0,
      transmission: 0.9,
      thickness: 0.006,
      ior: 1.52,
      transparent: true,
      depthWrite: false,
    }),
  };
}

export type FurnitureMaterials = ReturnType<typeof createFurnitureMaterials>;
