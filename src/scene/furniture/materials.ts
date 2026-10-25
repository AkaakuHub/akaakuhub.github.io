import type { MaterialLibrary } from "../materials/library";
import { Vector2 } from "three";
import { scannedSurface } from "../materials/surface";
import type { MetalMaterials } from "../materials/metal";
import type { PropMaterials } from "../materials/props";

export function createFurnitureMaterials(
  maps: MaterialLibrary,
  metals: MetalMaterials,
  props: PropMaterials,
) {
  return {
    ash: scannedSurface(maps.ash, {
      roughnessMap: null,
      roughness: 0.76,
      normalScale: new Vector2(0.4, 0.4),
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
