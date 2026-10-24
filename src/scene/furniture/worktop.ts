import type { Group } from "three";
import { desktopComputer } from "./computer";
import { ceramicMug } from "./ceramic";
import type { FurnitureMaterials } from "./materials";

export function createWorktopObjects(
  parent: Group,
  materials: FurnitureMaterials,
  surfaceY: number,
): void {
  const computer = desktopComputer();
  computer.position.set(0.04, surfaceY, 0.57);
  computer.rotation.y = Math.PI / 2;
  parent.add(computer);
  const cup = ceramicMug(materials.porcelain, 0.09, 0.042);
  cup.position.set(-0.22, surfaceY, 0.63);
  cup.rotation.y = Math.PI / 2;
  parent.add(cup);
}
