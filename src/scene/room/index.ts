import type { PropMaterials } from "../materials/props";
import { Group } from "three";
import type { MaterialLibrary } from "../materials/library";
import type { MetalMaterials } from "../materials/metal";
import { box } from "../primitives";
import { createCeiling } from "./ceiling";
import { createDoor } from "./door";
import { createArchitectureMaterials } from "./materials/architecture";
import { createWindow } from "./window";

export function createRoom(
  maps: MaterialLibrary,
  metals: MetalMaterials,
  props: PropMaterials,
): Group {
  const materials = createArchitectureMaterials(maps);
  const room = new Group();
  room.name = "clubroom-architecture";
  box(room, [5.4, 0.12, 5.4], [0, -0.06, 0], materials.floor);
  const wall = materials.wall;
  for (const z of [-2.67, 2.67]) {
    box(room, [5.4, 2.9, 0.14], [0, 1.45, z], wall);
  }
  box(room, [0.14, 2.9, 3.08], [2.67, 1.45, -1.16], wall);
  box(room, [0.14, 2.9, 1.2], [2.67, 1.45, 2.1], wall);
  box(room, [0.14, 0.65, 1.12], [2.67, 2.575, 0.95], wall);
  box(room, [0.1, 2.9, 1.7], [3.35, 1.45, 0.95], wall);
  box(room, [0.14, 0.98, 5.4], [-2.67, 0.49, 0], wall);
  box(room, [0.14, 0.35, 5.4], [-2.67, 2.725, 0], wall);
  for (const z of [-2.3, 2.3]) {
    box(room, [0.14, 1.57, 0.74], [-2.67, 1.765, z], wall);
  }
  const boards = materials.boards;
  const trim = materials.trim;
  for (const z of [-2.586, 2.586]) {
    box(room, [5.2, 0.84, 0.025], [0, 0.42, z], boards);
    box(room, [5.2, 0.07, 0.05], [0, 0.043, z - Math.sign(z) * 0.015], trim);
    box(room, [5.2, 0.038, 0.065], [0, 0.862, z - Math.sign(z) * 0.017], trim);
    box(room, [5.2, 0.058, 0.045], [0, 2.724, z - Math.sign(z) * 0.012], trim);
  }
  for (const x of [-2.586, 2.586]) {
    box(room, [0.025, 0.84, 5.2], [x, 0.42, 0], boards);
    box(room, [0.05, 0.07, 5.2], [x - Math.sign(x) * 0.015, 0.043, 0], trim);
    box(room, [0.065, 0.038, 5.2], [x - Math.sign(x) * 0.017, 0.862, 0], trim);
    box(room, [0.045, 0.058, 5.2], [x - Math.sign(x) * 0.012, 2.724, 0], trim);
  }
  for (const x of [-2.535, 2.535]) {
    for (const z of [-2.535, 2.535]) {
      box(room, [0.13, 2.9, 0.13], [x, 1.45, z], wall);
      box(room, [0.145, 0.9, 0.145], [x, 0.45, z], boards);
      box(room, [0.155, 0.06, 0.155], [x, 0.87, z], trim);
    }
  }
  room.add(
    createCeiling(materials, metals),
    createWindow(materials, maps.fabric, metals, props),
    createDoor(materials, metals, props),
  );
  return room;
}
