import type { MetalMaterials } from "../materials/metal";
import { Group } from "three";
import type { MaterialLibrary } from "../materials/library";
import { createFurnitureMaterials } from "./materials";
import { createWorkbench } from "./workbench";
import { createCabinets } from "./cabinets";
import { createInstrumentCorner } from "./instrument";
import { createFrontFurniture } from "./front";

export function createFurniture(maps: MaterialLibrary, metals: MetalMaterials): Group {
  const furniture = new Group();
  furniture.name = "furniture";
  const materials = createFurnitureMaterials(maps, metals);
  furniture.add(
    createWorkbench(materials),
    createCabinets(materials),
    createInstrumentCorner(materials),
    createFrontFurniture(materials),
  );
  return furniture;
}
