import type { MetalMaterials } from "../materials/metal";
import { CylinderGeometry, Group, Mesh, PlaneGeometry, TorusGeometry } from "three";
import { box } from "../primitives";
import type { PbrMaps } from "../materials/library";
import { metricCylinderUv, metricTorusUv } from "../materials/uv";
import { curtainMaterials } from "./materials/fabric";

export function createCurtains(maps: PbrMaps, metals: MetalMaterials): Group {
  const curtains = new Group();
  const steel = metals.steel;
  const railGeometry = new CylinderGeometry(0.014, 0.014, 4.34, 12);
  metricCylinderUv(railGeometry);
  const rail = new Mesh(railGeometry, steel);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(-2.37, 2.7, 0);
  rail.castShadow = true;
  curtains.add(rail);
  for (const z of [-2.12, 2.12]) {
    box(curtains, [0.19, 0.035, 0.04], [-2.46, 2.7, z], steel);
  }
  const material = curtainMaterials(maps);
  const ringGeometry = new TorusGeometry(0.025, 0.004, 6, 12);
  metricTorusUv(ringGeometry);
  const columns = 48;
  const rows = 10;
  for (const start of [-2.11, 1.51]) {
    const geometry = new PlaneGeometry(1, 1, columns, rows);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      const u = positions.getX(index) + 0.5;
      const v = positions.getY(index) + 0.5;
      const phase = u * Math.PI * 12;
      const release = (1 - v) ** 2;
      const folds = Math.sin(phase + Math.sin(u * Math.PI * 3) * release * 0.3);
      const scallop = (1 - Math.cos(phase)) * 0.004;
      const drape = Math.sin(u * Math.PI) * 0.016 * release;
      const hem = Math.exp(-((v / 0.03) ** 2)) * 0.002;
      positions.setXYZ(
        index,
        -2.37 + folds * (0.027 + release * 0.014) + hem,
        0.86 + v * 1.79 - drape - scallop,
        start + u * 0.6,
      );
    }
    const uv = geometry.getAttribute("uv");
    for (let row = 0; row <= rows; row++) {
      let length = 0;
      for (let column = 0; column <= columns; column++) {
        const index = row * (columns + 1) + column;
        if (column > 0) {
          length += Math.hypot(
            positions.getX(index) - positions.getX(index - 1),
            positions.getZ(index) - positions.getZ(index - 1),
          );
        }
        uv.setXY(index, length, positions.getY(index) - 0.86);
      }
    }
    geometry.computeVertexNormals();
    const panel = new Mesh(geometry, material);
    panel.name = "linen-curtain";
    panel.castShadow = true;
    panel.receiveShadow = true;
    curtains.add(panel);
    for (let ringIndex = 0; ringIndex < 7; ringIndex++) {
      const ring = new Mesh(ringGeometry, steel);
      ring.position.set(-2.37, 2.676, start + ringIndex * 0.1);
      ring.castShadow = true;
      curtains.add(ring);
    }
  }
  return curtains;
}
