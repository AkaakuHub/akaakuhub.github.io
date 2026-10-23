import { Group, Mesh, TorusGeometry } from "three";
import { box } from "../primitives";
import { cylinder, leaf, rail } from "./details";
import type { FurnitureMaterials } from "./materials";

function chair(materials: FurnitureMaterials): Group {
  const group = new Group();
  const seat = box(group, [0.42, 0.033, 0.4], [0, 0.44, 0], materials.chair);
  seat.rotation.x = -0.025;
  const back = box(group, [0.42, 0.25, 0.025], [0, 0.72, 0.17], materials.chair);
  back.rotation.x = -0.1;
  for (const x of [-0.17, 0.17]) {
    rail(group, [x, 0.03, -0.2], [x, 0.44, -0.13], 0.013, materials.steel);
    rail(group, [x, 0.03, 0.23], [x, 0.83, 0.19], 0.013, materials.steel);
    rail(group, [x, 0.3, -0.16], [x, 0.3, 0.2], 0.011, materials.steel);
    for (const z of [-0.2, 0.23]) {
      cylinder(group, 0.017, 0.03, [x, 0.02, z], materials.rubber);
    }
  }
  group.rotation.y = Math.PI / 2 + 0.08;
  group.position.set(-1.02, 0, -0.3);
  return group;
}

function deskObjects(parent: Group, materials: FurnitureMaterials): void {
  const notebook = box(parent, [0.3, 0.025, 0.22], [0.04, 0.775, 0.22], materials.chair);
  notebook.rotation.y = -0.12;
  box(notebook, [0.285, 0.016, 0.208], [0.002, 0.001, 0], materials.paper);
  box(parent, [0.16, 0.012, 0.24], [-0.16, 0.77, -0.25], materials.paper).rotation.y = 0.22;
  const pen = cylinder(parent, 0.004, 0.14, [0.1, 0.794, 0.27], materials.black);
  pen.rotation.z = Math.PI / 2;
  const mug = cylinder(parent, 0.041, 0.085, [-0.26, 0.799, -0.62], materials.paper);
  cylinder(parent, 0.034, 0.002, [-0.26, 0.843, -0.62], materials.darkSteel);
  const handle = new Mesh(new TorusGeometry(0.028, 0.008, 8, 20), materials.paper);
  handle.position.set(0.046, 0.005, 0);
  mug.add(handle);
  cylinder(parent, 0.065, 0.12, [-0.24, 0.82, 0.69], materials.terracotta, 0.08);
  cylinder(parent, 0.073, 0.01, [-0.24, 0.883, 0.69], materials.edging);
  rail(parent, [-0.24, 0.88, 0.69], [-0.24, 1.12, 0.69], 0.005, materials.green);
  leaf(parent, [-0.28, 1.02, 0.69], -0.6, materials.green);
  leaf(parent, [-0.19, 1.08, 0.69], 0.7, materials.green);
  leaf(parent, [-0.25, 1.15, 0.69], 0.1, materials.green);
}

export function createDesk(materials: FurnitureMaterials): Group {
  const desk = new Group();
  box(desk, [0.86, 0.05, 1.85], [0, 0.73, 0], materials.edging);
  box(desk, [0.85, 0.012, 1.84], [0, 0.76, 0], materials.desktop);
  for (const x of [-0.33, 0.33]) {
    for (const z of [-0.77, 0.77]) {
      cylinder(desk, 0.022, 0.68, [x, 0.37, z], materials.steel);
      cylinder(desk, 0.025, 0.04, [x, 0.03, z], materials.rubber);
    }
    rail(desk, [x, 0.23, -0.77], [x, 0.23, 0.77], 0.014, materials.steel);
  }
  box(desk, [0.025, 0.16, 1.58], [-0.33, 0.6, 0], materials.darkSteel);
  deskObjects(desk, materials);
  desk.position.set(-1.9, 0, -0.45);
  const group = new Group();
  group.add(desk, chair(materials));
  return group;
}
