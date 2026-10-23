import type { MaterialLibrary } from "../materials/library";
import { physicalSurface, scannedSurface } from "../materials/surface";
import type { MetalMaterials } from "../materials/metal";
import type { PropMaterials } from "../materials/props";

export function createFurnitureMaterials(
  maps: MaterialLibrary,
  metals: MetalMaterials,
  props: PropMaterials,
) {
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
    ...props,
  };
}

export type FurnitureMaterials = ReturnType<typeof createFurnitureMaterials>;
