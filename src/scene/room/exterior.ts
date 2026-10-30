import { Group } from "three";
import type { PropMaterials } from "../materials/props";
import type { MetalMaterials } from "../materials/metal";
import type { ArchitectureMaterials } from "./materials/architecture";
import { box } from "../primitives";
import { chamferedBox } from "../geometry/chamfered-box";

export function createExterior(
  materials: ArchitectureMaterials,
  metals: MetalMaterials,
  props: Pick<PropMaterials, "glass">,
): Group {
  const exterior = new Group();
  exterior.name = "window-exterior";
  const balcony = new Group();
  balcony.name = "window-balcony";
  exterior.add(balcony);
  const concrete = materials.wall.clone();
  const railing = metals.enamel.clone();
  for (const material of [concrete, railing]) {
    material.name = "exterior-surface";
    material.emissiveMap = material.map;
  }
  box(balcony, [1.7, 0.16, 5.4], [-3.52, -0.1, 0], concrete);
  box(balcony, [0.12, 0.18, 5.4], [-4.31, 0.07, 0], concrete);
  for (const y of [0.24, 1.1])
    chamferedBox(balcony, [0.055, 0.045, 5.4], [-4.31, y, 0], railing, 0.004);
  for (let z = -2.6; z <= 2.6; z += 0.26)
    box(balcony, [0.025, 0.84, 0.025], [-4.31, 0.66, z], railing);
  for (const z of [-2.66, 2.66]) {
    chamferedBox(balcony, [1.6, 0.045, 0.055], [-3.51, 1.1, z], railing, 0.004);
    for (let x = -4.25; x < -2.75; x += 0.26)
      box(balcony, [0.025, 1.02, 0.025], [x, 0.57, z], railing);
  }
  const building = box(exterior, [0.55, 1.25, 7.4], [-7.6, 0.15, 0.3], concrete);
  building.castShadow = false;
  const glass = props.glass.clone();
  glass.color.set("#637d82");
  glass.transmission = 0;
  glass.roughness = 0.33;
  for (let z = -2.9; z < 3.3; z += 0.75) {
    const pane = box(exterior, [0.03, 0.56, 0.44], [-7.3, 0.32, z], glass);
    pane.castShadow = false;
  }
  return exterior;
}
