import type { Group } from "three";
import { box } from "../primitives";
import { HardwareBatch, metricCylinderGeometry } from "../details/hardware";
import { cylinder, rod, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

export function cartFrame(cart: Group, materials: FurnitureMaterials): void {
  const hardware = new HardwareBatch();
  const fastener = metricCylinderGeometry(0.0045, 0.003, 6);
  for (const x of [-0.285, 0.285]) {
    for (const z of [-0.17, 0.17]) {
      rod(cart, [x, 0.075, z], [x, 0.94, z], 0.012, materials.metal);
      const wheel = cylinder(cart, 0.035, 0.022, [x, 0.035, z], materials.rubber);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(cart, 0.014, 0.025, [x, 0.035, z], materials.metal);
      hub.rotation.z = Math.PI / 2;
      for (const side of [-1, 1])
        box(cart, [0.002, 0.039, 0.026], [x + side * 0.015, 0.051, z], materials.metal);
      box(cart, [0.032, 0.002, 0.026], [x, 0.071, z], materials.metal);
      cylinder(cart, 0.014, 0.012, [x, 0.078, z], materials.metal);
      for (const y of [0.18, 0.57, 0.9])
        hardware.add(
          fastener,
          materials.metal,
          [x, y, z + Math.sign(z) * 0.014],
          [Math.PI / 2, 0, 0],
        );
    }
    rod(cart, [x, 0.94, -0.17], [x, 0.94, 0.17], 0.012, materials.metal);
    for (const z of [-0.17, 0.17])
      cylinder(cart, 0.0125, 0.003, [x, 0.9415, z], materials.graphite);
  }
  for (const y of [0.18, 0.57, 0.9]) {
    box(cart, [0.62, 0.0015, 0.4], [0, y + 0.01175, 0], materials.enamel);
    for (const x of [-0.309, 0.309])
      box(cart, [0.002, 0.022, 0.4], [x, y + 0.0015, 0], materials.enamel);
    box(cart, [0.616, 0.022, 0.002], [0, y + 0.0015, 0.199], materials.enamel);
    box(cart, [0.616, 0.043, 0.0015], [0, y + 0.033, -0.199], materials.enamel);
    roundBox(cart, [0.62, 0.004, 0.005], [0, y + 0.054, -0.198], materials.enamel, 0.0015);
  }
  hardware.finish(cart);
  fastener.dispose();
}
