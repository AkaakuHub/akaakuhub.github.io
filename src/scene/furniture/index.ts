import type { PropMaterials } from "../materials/props";
import type { MetalMaterials } from "../materials/metal";
import { Group, Mesh, Vector3 } from "three";
import type { MaterialLibrary } from "../materials/library";
import { createFurnitureMaterials } from "./materials";
import { createWorkbench } from "./workbench";
import { createFrontFurniture } from "./front";
import { orientWoodGrain } from "../materials/wood-grain";

export function createFurniture(
  maps: MaterialLibrary,
  metals: MetalMaterials,
  props: PropMaterials,
): Group {
  const furniture = new Group();
  furniture.name = "furniture";
  const materials = createFurnitureMaterials(maps, metals, props);
  furniture.add(createWorkbench(materials), createFrontFurniture(materials));
  const size = new Vector3();
  furniture.traverse((object) => {
    if (!(object instanceof Mesh) || object.material !== materials.oak) return;
    object.geometry.computeBoundingBox();
    object.geometry.boundingBox!.getSize(size);
    const axis = size.y > size.x && size.y > size.z ? "y" : size.z > size.x ? "z" : "x";
    orientWoodGrain(object, axis, "v");
  });
  return furniture;
}
