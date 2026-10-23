import { Group, MeshStandardMaterial } from "three";
import { box, surface } from "../primitives";
import { createDoor } from "./door";
import { createWindow } from "./window";
import { floorTexture, plasterTexture } from "./textures";

export function createRoom(): Group {
  const room = new Group();
  const wood = floorTexture();
  const floor = new MeshStandardMaterial({
    map: wood,
    bumpMap: wood,
    bumpScale: 0.008,
    roughness: 0.65,
    metalness: 0,
  });
  box(room, [5.4, 0.12, 5.4], [0, -0.06, 0], floor);
  const plaster = plasterTexture();
  const wall = new MeshStandardMaterial({
    map: plaster,
    bumpMap: plaster,
    bumpScale: 0.012,
    roughness: 0.95,
  });
  box(room, [5.4, 2.9, 0.14], [0, 1.45, -2.67], wall);
  box(room, [5.4, 2.9, 0.14], [0, 1.45, 2.67], wall);
  box(room, [0.14, 2.9, 5.4], [2.67, 1.45, 0], wall);
  box(room, [0.14, 0.98, 5.4], [-2.67, 0.49, 0], wall);
  box(room, [0.14, 0.35, 5.4], [-2.67, 2.725, 0], wall);
  for (const z of [-2.3, 2.3]) {
    box(room, [0.14, 1.57, 0.74], [-2.67, 1.765, z], wall);
  }
  const skirting = surface("#6e7568", 0.8);
  const lowerWall = surface("#c7cdba", 0.9);
  for (const z of [-2.59, 2.59]) {
    box(room, [5.2, 0.76, 0.025], [0, 0.42, z], lowerWall);
    box(room, [5.2, 0.09, 0.045], [0, 0.045, z], skirting);
    box(room, [5.2, 0.025, 0.04], [0, 0.81, z], skirting);
  }
  for (const x of [-2.59, 2.59]) {
    box(room, [0.025, 0.76, 5.2], [x, 0.42, 0], lowerWall);
    box(room, [0.045, 0.09, 5.2], [x, 0.045, 0], skirting);
    box(room, [0.04, 0.025, 5.2], [x, 0.81, 0], skirting);
  }
  const ceiling = surface("#e1e0d4", 0.95);
  box(room, [5.4, 0.1, 5.4], [0, 2.95, 0], ceiling);
  const seams = surface("#b9bcb1", 0.9);
  for (let offset = -2.4; offset < 2.6; offset += 0.6) {
    box(room, [0.009, 0.008, 5.2], [offset, 2.895, 0], seams);
    box(room, [5.2, 0.008, 0.009], [0, 2.895, offset], seams);
  }
  const fixture = surface("#a8ada5", 0.42, 0.45);
  const light = new MeshStandardMaterial({
    color: "#fff7df",
    emissive: "#fff4d5",
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  for (const z of [-1.05, 1.35]) {
    box(room, [0.43, 0.07, 1.15], [0, 2.83, z], fixture);
    for (const x of [-0.12, 0.12]) {
      box(room, [0.06, 0.035, 1.03], [x, 2.778, z], light);
    }
  }
  room.add(createWindow(), createDoor());
  return room;
}
