import { Group } from "three";
import { createDesk } from "./desk";
import { createFurnitureMaterials } from "./materials";
import { createStorage } from "./storage";

export function createFurniture(): Group {
  const group = new Group();
  group.name = "furniture";
  const materials = createFurnitureMaterials();
  group.add(createDesk(materials), createStorage(materials));
  return group;
}
