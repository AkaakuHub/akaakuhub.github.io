import { MeshPhysicalMaterial } from "three";
import type { MaterialLibrary } from "../materials/library";
import { scannedSurface } from "../materials/surface";
import type { MetalMaterials } from "../materials/metal";
import { surface } from "../primitives";

export function createFurnitureMaterials(maps: MaterialLibrary, metals: MetalMaterials) {
  return {
    ash: scannedSurface(maps.ash),
    walnut: scannedSurface(maps.walnut),
    amber: scannedSurface(maps.ash, { color: "#d7b07a", roughness: 0.65 }),
    ivory: metals.ivory,
    enamel: metals.enamel,
    deepGreen: metals.deepGreen,
    metal: metals.steel,
    brass: metals.brass,
    graphite: metals.graphite,
    rubber: metals.rubber,
    paper: surface("#eae3cf", 0.94),
    terracotta: surface("#a97055", 0.89),
    foliage: surface("#5c714e", 0.86),
    navy: surface("#526371", 0.82),
    rust: surface("#9f634f", 0.85),
    mustard: surface("#b49b5c", 0.88),
    glass: new MeshPhysicalMaterial({
      color: "#dce9df",
      roughness: 0.065,
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
