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
  const { material, depth } = curtainMaterials(maps);
  for (const start of [-2.11, 1.51]) {
    const geometry = new PlaneGeometry(1, 1, 72, 12);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      const u = positions.getX(index) + 0.5;
      const v = positions.getY(index) + 0.5;
      const folds = Math.sin(u * Math.PI * 22);
      const drape = Math.sin(u * Math.PI) * 0.018 * (1 - v);
      positions.setXYZ(
        index,
        -2.36 + folds * (0.027 + (1 - v) * 0.014),
        0.86 + v * 1.79 - drape,
        start + u * 0.6,
      );
    }
    const uv = geometry.getAttribute("uv");
    for (let row = 0; row <= 12; row++) {
      let length = 0;
      for (let column = 0; column <= 72; column++) {
        const index = row * 73 + column;
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
    panel.customDepthMaterial = depth;
    panel.castShadow = true;
    panel.receiveShadow = true;
    curtains.add(panel);
    for (let ringIndex = 0; ringIndex < 7; ringIndex++) {
      const ringGeometry = new TorusGeometry(0.025, 0.004, 6, 12);
      metricTorusUv(ringGeometry);
      const ring = new Mesh(ringGeometry, steel);
      ring.position.set(-2.37, 2.676, start + ringIndex * 0.1);
      ring.castShadow = true;
      curtains.add(ring);
    }
  }
  return curtains;
}
