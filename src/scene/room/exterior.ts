import { BoxGeometry, Group, InstancedMesh, Matrix4 } from "three";
import type { MetalMaterials } from "../materials/metal";
import type { ArchitectureMaterials } from "./materials/architecture";
import { box } from "../primitives";
import { chamferedBox } from "../geometry/chamfered-box";

export function createExterior(materials: ArchitectureMaterials, metals: MetalMaterials): Group {
  const exterior = new Group();
  exterior.name = "window-exterior";
  const balcony = new Group();
  balcony.name = "window-balcony";
  exterior.add(balcony);
  const concrete = materials.wall.clone();
  concrete.color.set("#8a928d");
  const railing = metals.enamel.clone();
  railing.color.set("#687873");
  for (const material of [concrete, railing]) {
    material.name = "exterior-surface";
    material.emissiveMap = material.map;
  }
  const slab = box(balcony, [1.8, 0.16, 5.4], [-3.5, -0.1, 0], concrete);
  slab.name = "balcony-slab";
  box(balcony, [0.1, 0.1, 5.32], [-4.31, 0.03, 0], concrete);
  const supports: readonly [number, number][] = [
    [-4.31, -2.61],
    [-4.31, 0],
    [-4.31, 2.61],
    [-2.74, -2.61],
    [-2.74, 2.61],
  ];
  for (const [x, z] of supports) {
    const post = box(balcony, [0.055, 1.1, 0.055], [x, 0.53, z], railing);
    post.name = "balcony-post";
  }
  for (const y of [0.18, 1.08]) {
    const front = chamferedBox(balcony, [0.05, 0.05, 5.28], [-4.31, y, 0], railing, 0.004);
    front.name = "balcony-rail";
    for (const z of [-2.61, 2.61]) {
      const side = chamferedBox(balcony, [1.625, 0.05, 0.05], [-3.525, y, z], railing, 0.004);
      side.name = "balcony-rail";
    }
  }
  const bars: [number, number][] = [];
  for (let index = 1; index < 40; index++) {
    if (index !== 20) bars.push([-4.31, -2.61 + (5.22 * index) / 40]);
  }
  for (const z of [-2.61, 2.61]) {
    box(balcony, [1.57, 0.1, 0.1], [-3.525, 0.03, z], concrete);
    for (let index = 1; index < 12; index++) bars.push([-4.31 + (1.57 * index) / 12, z]);
  }
  const infill = new InstancedMesh(new BoxGeometry(0.018, 0.9, 0.018), railing, bars.length);
  infill.name = "balcony-infill";
  const matrix = new Matrix4();
  for (const [index, [x, z]] of bars.entries())
    infill.setMatrixAt(index, matrix.makeTranslation(x, 0.63, z));
  infill.castShadow = infill.receiveShadow = true;
  infill.computeBoundingBox();
  infill.computeBoundingSphere();
  balcony.add(infill);
  return exterior;
}
