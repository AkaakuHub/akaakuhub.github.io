import { Group } from "three";
import { createFurnitureMaterials } from "./materials";
import { createWorkbench } from "./workbench";
import { createCabinets } from "./cabinets";
import { createInstrumentCorner } from "./instrument";
import { createFrontFurniture } from "./front";

export function createFurniture(): Group {
  const furniture = new Group();
  furniture.name = "furniture";
  const materials = createFurnitureMaterials();
  furniture.add(
    createWorkbench(materials),
    createCabinets(materials),
    createInstrumentCorner(materials),
    createFrontFurniture(materials),
  );
  return furniture;
}
