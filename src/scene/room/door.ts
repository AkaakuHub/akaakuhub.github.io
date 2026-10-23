import { CylinderGeometry, Group, Mesh, MeshPhysicalMaterial } from "three";
import { box, surface } from "../primitives";
import type { ArchitectureMaterials } from "./materials/architecture";

export function createDoor(materials: ArchitectureMaterials): Group {
  const door = new Group();
  door.position.set(2.51, 0, 0.95);
  const wood = materials.door;
  const trim = materials.trim;
  const gasket = surface("#554f44", 0.95);
  const steel = surface("#a9afa7", 0.28, 0.82);
  for (const z of [-0.54, 0.54]) {
    box(door, [0.14, 2.24, 0.075], [0, 1.12, z], trim);
  }
  box(door, [0.14, 0.075, 1.16], [0, 2.25, 0], trim);
  box(door, [0.06, 1.17, 1.0], [0.027, 0.6, 0], wood);
  box(door, [0.06, 0.17, 1.0], [0.027, 2.13, 0], wood);
  box(door, [0.06, 0.86, 0.26], [0.027, 1.62, -0.37], wood);
  box(door, [0.06, 0.86, 0.2], [0.027, 1.62, 0.4], wood);
  const glass = new MeshPhysicalMaterial({
    color: "#bdc6b9",
    roughness: 0.68,
    metalness: 0,
    transmission: 0.35,
    thickness: 0.006,
  });
  box(door, [0.012, 0.82, 0.53], [-0.023, 1.62, 0.03], glass).castShadow = false;
  for (const z of [-0.24, 0.3]) {
    box(door, [0.028, 0.86, 0.027], [-0.027, 1.62, z], trim);
  }
  for (const y of [1.2, 2.04]) {
    box(door, [0.028, 0.027, 0.57], [-0.027, y, 0.03], trim);
  }
  box(door, [0.012, 0.22, 0.075], [-0.013, 0.985, -0.35], steel);
  const spindle = new Mesh(new CylinderGeometry(0.019, 0.019, 0.075, 12), steel);
  spindle.rotation.z = Math.PI / 2;
  spindle.position.set(-0.055, 1.025, -0.35);
  door.add(spindle);
  const handle = box(door, [0.024, 0.027, 0.15], [-0.1, 1.025, -0.29], steel);
  handle.rotation.x = -0.05;
  box(door, [0.015, 0.16, 0.81], [-0.013, 0.15, 0], steel);
  box(door, [0.025, 0.025, 1.01], [-0.015, 0.017, 0], gasket);
  for (const y of [0.45, 1.1, 1.95]) {
    box(door, [0.038, 0.095, 0.03], [-0.027, y, 0.48], steel);
  }
  const switchPlate = box(
    door,
    [0.025, 0.115, 0.07],
    [-0.011, 1.16, -0.8],
    surface("#dad6c5", 0.61),
  );
  box(switchPlate, [0.016, 0.06, 0.04], [-0.018, 0, 0], surface("#c8c6b7", 0.66));
  return door;
}
