import { Group } from "three";
import type { MaterialLibrary } from "../materials/library";
import { createFurnitureMaterials } from "./materials";
import { createWorkbench } from "./workbench";
import { createCabinets } from "./cabinets";
import { createInstrumentCorner } from "./instrument";
import { createFrontFurniture } from "./front";

export function createFurniture(maps: MaterialLibrary): Group {
  const furniture = new Group();
  furniture.name = "furniture";
  const materials = createFurnitureMaterials(maps);
  furniture.add(
    createWorkbench(materials),
    createCabinets(materials),
    createInstrumentCorner(materials),
    createFrontFurniture(materials),
  );
  return furniture;
}
