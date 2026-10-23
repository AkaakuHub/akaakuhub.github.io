import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { box, surface } from "../primitives";
import type { ArchitectureMaterials } from "./materials/architecture";

export function createCeiling(materials: ArchitectureMaterials): Group {
  const ceiling = new Group();
  box(ceiling, [5.4, 0.1, 5.4], [0, 2.95, 0], materials.ceiling);
  const beams = materials.frame;
  for (const x of [-1.3, 1.3]) {
    box(ceiling, [0.105, 0.12, 5.2], [x, 2.85, 0], beams);
  }
  const seam = surface("#a7ab9d", 0.8);
  for (let z = -1.95; z < 2.6; z += 0.65) {
    box(ceiling, [5.2, 0.012, 0.012], [0, 2.893, z], seam);
  }
  const frame = surface("#bec2b4", 0.4, 0.58);
  const socket = surface("#e1e0cf", 0.62);
  const tubeMaterial = new MeshStandardMaterial({
    color: "#edf3df",
    emissive: "#efffdf",
    emissiveIntensity: 1.8,
    roughness: 0.27,
  });
  for (const z of [-1.05, 1.35]) {
    box(ceiling, [0.35, 0.042, 1.19], [0, 2.83, z], frame);
    for (const x of [-0.167, 0.167]) {
      box(ceiling, [0.018, 0.048, 1.19], [x, 2.805, z], frame);
    }
    for (const x of [-0.085, 0.085]) {
      for (const edge of [-0.55, 0.55]) {
        box(ceiling, [0.055, 0.055, 0.05], [x, 2.79, z + edge], socket);
      }
      const tube = new Mesh(new CylinderGeometry(0.019, 0.019, 1.06, 12), tubeMaterial);
      tube.name = "room-fluorescent";
      tube.rotation.x = Math.PI / 2;
      tube.position.set(x, 2.776, z);
      ceiling.add(tube);
    }
  }
  box(ceiling, [0.018, 0.018, 4.8], [0.23, 2.88, 0], frame);
  return ceiling;
}
