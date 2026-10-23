import { Group } from "three";
import type { Material } from "three";
import { HardwareBatch } from "../../details/hardware";
import { cylinder, roundBox } from "../geometry";

export function caseLatch(material: Material): Group {
  const latch = new Group();
  const hardware = new HardwareBatch();
  roundBox(latch, [0.002, 0.028, 0.033], [0.001, 0, -0.026], material, 0.0005);
  roundBox(latch, [0.002, 0.028, 0.026], [0.001, 0, 0.026], material, 0.0005);
  roundBox(latch, [0.004, 0.018, 0.043], [0.004, 0, 0.001], material, 0.001);
  roundBox(latch, [0.004, 0.025, 0.007], [0.004, 0, 0.02], material, 0.0008);
  cylinder(latch, 0.0025, 0.022, [0.004, 0, -0.019], material);
  for (const y of [-0.008, 0.008])
    for (const z of [-0.035, 0.032]) hardware.screw(material, [0.0021, y, z], [0, Math.PI / 2, 0]);
  hardware.finish(latch);
  return latch;
}
