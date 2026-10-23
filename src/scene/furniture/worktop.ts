import { CatmullRomCurve3, Curve, Group, Mesh, TubeGeometry, Vector3 } from "three";
import { box } from "../primitives";
import { closedNotebook } from "./bindings";
import { ceramicMug } from "./ceramic";
import { cylinder, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

class BenchCable extends Curve<Vector3> {
  constructor(
    private readonly curve: CatmullRomCurve3,
    private readonly surfaceY: number,
  ) {
    super();
  }
  override getPoint(t: number, target = new Vector3()): Vector3 {
    this.curve.getPoint(t, target);
    target.y = Math.max(this.surfaceY + 0.003, target.y);
    return target;
  }
}

function solderStation(parent: Group, materials: FurnitureMaterials, matTop: number): void {
  const station = new Group();
  station.position.set(-0.16, matTop, 0.13);
  roundBox(station, [0.23, 0.11, 0.19], [0, 0.067, 0], materials.ivory, 0.016);
  box(station, [0.235, 0.024, 0.193], [0, 0.012, 0], materials.graphite);
  box(station, [0.002, 0.035, 0.075], [0.116, 0.067, 0.02], materials.deepGreen);
  cylinder(station, 0.023, 0.011, [0.1225, 0.055, -0.054], materials.graphite).rotation.z =
    Math.PI / 2;
  cylinder(station, 0.003, 0.005, [0.1185, 0.085, -0.025], materials.rust).rotation.z = Math.PI / 2;
  parent.add(station);
  roundBox(parent, [0.075, 0.014, 0.11], [0.18, matTop + 0.007, -0.225], materials.graphite, 0.003);
  rod(parent, [0.15, matTop + 0.02, -0.22], [0.18, matTop + 0.014, -0.22], 0.003, materials.metal);
  rod(parent, [0.18, matTop + 0.014, -0.22], [0.21, matTop + 0.02, -0.22], 0.003, materials.metal);
  const handleBack = new Vector3(0.18, matTop + 0.013, -0.08);
  rod(
    parent,
    [handleBack.x, handleBack.y, handleBack.z],
    [0.18, matTop + 0.028, -0.25],
    0.009,
    materials.graphite,
  );
  rod(parent, [0.18, matTop + 0.028, -0.25], [0.18, matTop + 0.032, -0.31], 0.004, materials.metal);
  const curve = new BenchCable(
    new CatmullRomCurve3([
      new Vector3(-0.04, matTop + 0.02, 0.17),
      new Vector3(0.2, matTop + 0.003, 0.28),
      new Vector3(0.28, matTop + 0.003, 0.04),
      handleBack,
    ]),
    matTop,
  );
  const cord = new Mesh(new TubeGeometry(curve, 48, 0.003, 8, false), materials.rubber);
  cord.castShadow = true;
  parent.add(cord);
  cylinder(parent, 0.039, 0.05, [-0.19, matTop + 0.025, -0.23], materials.metal);
  cylinder(parent, 0.047, 0.008, [-0.19, matTop + 0.054, -0.23], materials.ivory);
  cylinder(parent, 0.012, 0.01, [-0.19, matTop + 0.063, -0.23], materials.graphite);
}

export function createWorktopObjects(
  parent: Group,
  materials: FurnitureMaterials,
  surfaceY: number,
): void {
  const mat = roundBox(
    parent,
    [0.51, 0.008, 0.6],
    [0.04, surfaceY + 0.004, -0.05],
    materials.deepGreen,
    0.003,
  );
  for (let line = -2; line <= 2; line++) {
    box(mat, [0.41, 0.0003, 0.001], [0, 0.00415, line * 0.08], materials.enamel);
    box(mat, [0.001, 0.0003, 0.48], [line * 0.08, 0.00415, 0], materials.enamel);
  }
  solderStation(parent, materials, surfaceY + 0.008);
  const notebook = closedNotebook(0.32, 0.025, 0.24, materials.rust, materials);
  notebook.position.set(0.02, surfaceY, 0.57);
  notebook.rotation.y = -0.1;
  parent.add(notebook);
  rod(
    parent,
    [-0.1, surfaceY + 0.029, 0.55],
    [0.08, surfaceY + 0.029, 0.61],
    0.004,
    materials.graphite,
  );
  const cup = ceramicMug(materials.terracotta, 0.09, 0.042);
  cup.position.set(-0.22, surfaceY, 0.63);
  cup.rotation.y = Math.PI / 2;
  parent.add(cup);
}
