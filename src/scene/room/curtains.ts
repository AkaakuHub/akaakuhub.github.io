import { CylinderGeometry, Group, Mesh, PlaneGeometry, TorusGeometry } from "three";
import { box, surface } from "../primitives";
import { curtainMaterials } from "./materials/fabric";

export function createCurtains(): Group {
  const curtains = new Group();
  const steel = surface("#aaa99a", 0.36, 0.7);
  const rail = new Mesh(new CylinderGeometry(0.014, 0.014, 4.34, 12), steel);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(-2.37, 2.7, 0);
  rail.castShadow = true;
  curtains.add(rail);
  for (const z of [-2.12, 2.12]) {
    box(curtains, [0.19, 0.035, 0.04], [-2.46, 2.7, z], steel);
  }
  const { material, depth } = curtainMaterials();
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
    geometry.computeVertexNormals();
    const panel = new Mesh(geometry, material);
    panel.name = "linen-curtain";
    panel.customDepthMaterial = depth;
    panel.castShadow = true;
    panel.receiveShadow = true;
    curtains.add(panel);
    for (let ringIndex = 0; ringIndex < 7; ringIndex++) {
      const ring = new Mesh(new TorusGeometry(0.025, 0.004, 6, 12), steel);
      ring.position.set(-2.37, 2.676, start + ringIndex * 0.1);
      ring.castShadow = true;
      curtains.add(ring);
    }
  }
  return curtains;
}
