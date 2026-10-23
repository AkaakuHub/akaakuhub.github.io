import { CylinderGeometry, Group, Mesh, MeshPhysicalMaterial } from "three";
import { box, surface } from "../primitives";

export function createDoor(): Group {
  const door = new Group();
  door.position.set(2.52, 0, 0.95);
  const trim = surface("#8b948b", 0.52, 0.2);
  const panel = surface("#a9b3a5", 0.76);
  for (const z of [-0.52, 0.52]) {
    box(door, [0.13, 2.26, 0.07], [0, 1.13, z], trim);
  }
  box(door, [0.13, 0.07, 1.1], [0, 2.25, 0], trim);
  box(door, [0.055, 1.08, 0.98], [0.025, 0.56, 0], panel);
  box(door, [0.055, 0.21, 0.98], [0.025, 2.11, 0], panel);
  for (const z of [-0.43, 0.43]) {
    box(door, [0.055, 0.9, 0.12], [0.025, 1.55, z], panel);
  }
  const glass = new MeshPhysicalMaterial({
    color: "#b9c9c1",
    roughness: 0.75,
    metalness: 0.05,
    transparent: true,
    opacity: 0.7,
  });
  box(door, [0.035, 0.84, 0.73], [0.015, 1.55, 0], glass);
  box(door, [0.03, 0.025, 0.78], [-0.017, 1.55, 0], trim);
  box(door, [0.035, 0.9, 0.025], [-0.017, 1.55, 0], trim);
  const steel = surface("#b9bdb8", 0.24, 0.88);
  box(door, [0.018, 0.24, 0.07], [-0.023, 0.98, -0.37], steel);
  const handle = new Mesh(new CylinderGeometry(0.018, 0.018, 0.18, 12), steel);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(-0.105, 1.03, -0.3);
  handle.castShadow = true;
  door.add(handle);
  box(door, [0.09, 0.025, 0.035], [-0.063, 1.03, -0.37], steel);
  box(door, [0.04, 0.08, 0.74], [-0.013, 0.12, 0], steel);
  return door;
}
