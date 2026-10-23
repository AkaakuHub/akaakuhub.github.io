import { Group } from "three";
import { cylinder, rod } from "../geometry";
import { guitar } from "./guitar";
import { hardCase } from "./case";
import type { FurnitureMaterials } from "../materials";

export function createInstrumentCorner(materials: FurnitureMaterials): Group {
  const group = new Group();
  const instrument = guitar(materials);
  instrument.rotation.set(-0.09, -Math.PI / 2 + 0.2, -0.1);
  instrument.position.set(-2.04, 0.12, 1.25);
  const stand = new Group();
  stand.name = "guitar-stand";
  for (const x of [-0.2, 0.2])
    for (const z of [-0.15, 0.15]) cylinder(stand, 0.017, 0.012, [x, 0.006, z], materials.rubber);
  for (const z of [-0.15, 0.15])
    rod(stand, [-0.2, 0.02, z], [0.2, 0.02, z], 0.01, materials.graphite);
  rod(stand, [0.08, 0.03, 0], [-0.05, 0.65, 0], 0.012, materials.graphite);
  for (const [z, height] of [
    [-0.12, 0.1445],
    [0.12, 0.1387],
  ] as const)
    rod(stand, [-0.02, height, z], [0.12, height, z], 0.017, materials.rubber);
  stand.position.set(-2.08, 0, 1.25);
  group.add(instrument, stand, hardCase(materials));
  return group;
}
