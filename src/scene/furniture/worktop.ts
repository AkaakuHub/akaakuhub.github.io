import { CatmullRomCurve3, Mesh, TorusGeometry, TubeGeometry, Vector3 } from "three";
import type { Group } from "three";
import { box } from "../primitives";
import { cylinder, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

export function createWorktopObjects(parent: Group, materials: FurnitureMaterials): void {
  const mat = roundBox(
    parent,
    [0.51, 0.008, 0.6],
    [0.04, 0.803, -0.05],
    materials.deepGreen,
    0.006,
  );
  for (let line = -2; line <= 2; line++) {
    box(mat, [0.41, 0.001, 0.001], [0, 0.005, line * 0.08], materials.enamel);
    box(mat, [0.001, 0.001, 0.48], [line * 0.08, 0.005, 0], materials.enamel);
  }
  roundBox(parent, [0.23, 0.11, 0.19], [-0.16, 0.86, 0.13], materials.ivory, 0.016);
  box(parent, [0.235, 0.027, 0.193], [-0.16, 0.812, 0.13], materials.graphite);
  box(parent, [0.002, 0.035, 0.075], [-0.039, 0.87, 0.15], materials.deepGreen);
  const dial = cylinder(parent, 0.023, 0.011, [-0.034, 0.86, 0.076], materials.graphite);
  dial.rotation.z = Math.PI / 2;
  cylinder(parent, 0.003, 0.005, [-0.033, 0.89, 0.105], materials.rust).rotation.z = Math.PI / 2;
  const iron = rod(parent, [0.18, 0.825, -0.08], [0.18, 0.84, -0.25], 0.009, materials.graphite);
  rod(parent, [0.18, 0.84, -0.25], [0.18, 0.844, -0.31], 0.004, materials.metal);
  const cable = new CatmullRomCurve3([
    new Vector3(-0.04, 0.83, 0.17),
    new Vector3(0.2, 0.812, 0.28),
    new Vector3(0.28, 0.815, 0.04),
    iron.position.clone(),
  ]);
  const cord = new Mesh(new TubeGeometry(cable, 24, 0.003, 5, false), materials.rubber);
  cord.castShadow = true;
  parent.add(cord);
  cylinder(parent, 0.039, 0.05, [-0.19, 0.835, -0.23], materials.metal);
  cylinder(parent, 0.047, 0.008, [-0.19, 0.863, -0.23], materials.ivory);
  cylinder(parent, 0.012, 0.01, [-0.19, 0.87, -0.23], materials.graphite);
  const notebook = roundBox(
    parent,
    [0.32, 0.025, 0.24],
    [0.02, 0.815, 0.57],
    materials.rust,
    0.005,
  );
  box(notebook, [0.3, 0.016, 0.225], [0.005, 0, 0], materials.paper);
  notebook.rotation.y = -0.1;
  rod(parent, [-0.1, 0.835, 0.55], [0.08, 0.835, 0.61], 0.004, materials.graphite);
  cylinder(parent, 0.042, 0.09, [-0.22, 0.845, 0.63], materials.terracotta);
  cylinder(parent, 0.034, 0.002, [-0.22, 0.891, 0.63], materials.graphite);
  const handle = new Mesh(new TorusGeometry(0.03, 0.008, 8, 24), materials.terracotta);
  handle.position.set(-0.168, 0.852, 0.63);
  parent.add(handle);
}
