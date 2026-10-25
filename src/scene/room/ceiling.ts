import type { MetalMaterials } from "../materials/metal";
import { Group } from "three";
import { box } from "../primitives";
import type { ArchitectureMaterials } from "./materials/architecture";
import { createFluorescentFixtures } from "./fluorescent";

export function createCeiling(materials: ArchitectureMaterials, metals: MetalMaterials): Group {
  const ceiling = new Group();
  box(ceiling, [5.4, 0.1, 5.4], [0, 2.95, 0], materials.ceiling);
  const beams = materials.frame;
  for (const x of [-1.3, 1.3]) {
    box(ceiling, [0.105, 0.12, 5.2], [x, 2.85, 0], beams);
  }
  const frame = metals.ivory;
  ceiling.add(createFluorescentFixtures(metals));
  box(ceiling, [0.018, 0.018, 4.8], [0.23, 2.88, 0], frame);
  return ceiling;
}
