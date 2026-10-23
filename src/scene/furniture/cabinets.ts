import { Group } from "three";
import { box } from "../primitives";
import { cylinder, rod, roundBox } from "./geometry";
import { cabinetContents, tabletopObjects } from "./decor";
import type { FurnitureMaterials } from "./materials";

function pull(parent: Group, x: number, y: number, z: number, materials: FurnitureMaterials): void {
  rod(parent, [x - 0.065, y, z], [x + 0.065, y, z], 0.006, materials.brass);
  for (const offset of [-0.065, 0.065])
    rod(parent, [x + offset, y, z], [x + offset, y, z + 0.025], 0.005, materials.brass);
}

function lowCabinet(materials: FurnitureMaterials): Group {
  const cabinet = new Group();
  roundBox(cabinet, [1.66, 0.78, 0.51], [0, 0.54, 0], materials.ivory, 0.018);
  box(cabinet, [1.57, 0.68, 0.008], [0, 0.54, -0.26], materials.graphite);
  for (const x of [-0.71, 0.71]) {
    for (const z of [-0.18, 0.18]) {
      cylinder(cabinet, 0.023, 0.18, [x, 0.105, z], materials.deepGreen);
      cylinder(cabinet, 0.028, 0.018, [x, 0.025, z], materials.rubber);
    }
  }
  for (const height of [0.307, 0.54, 0.773]) {
    roundBox(cabinet, [0.7, 0.219, 0.028], [-0.42, height, -0.276], materials.ash, 0.005);
    pull(cabinet, -0.42, height + 0.02, -0.32, materials);
  }
  for (const x of [0.222, 0.594]) {
    roundBox(cabinet, [0.354, 0.685, 0.028], [x, 0.54, -0.276], materials.enamel, 0.005);
    pull(cabinet, x, 0.75, -0.32, materials);
  }
  roundBox(cabinet, [1.72, 0.048, 0.56], [0, 0.947, 0], materials.ash, 0.014);
  tabletopObjects(cabinet, materials);
  cabinet.position.set(-0.73, 0, 2.27);
  return cabinet;
}

function tallCabinet(materials: FurnitureMaterials): Group {
  const cabinet = new Group();
  const width = 1.02;
  roundBox(cabinet, [width, 1.98, 0.035], [0, 1.06, 0.225], materials.enamel, 0.012);
  box(cabinet, [0.91, 1.86, 0.012], [0, 1.06, 0.2], materials.ivory);
  for (const x of [-0.491, 0.491])
    roundBox(cabinet, [0.035, 1.98, 0.48], [x, 1.06, 0], materials.enamel, 0.009);
  for (const y of [0.087, 2.033])
    roundBox(cabinet, [width, 0.035, 0.48], [0, y, 0], materials.enamel, 0.009);
  for (const y of [0.17, 0.63, 1.03, 1.45, 1.92])
    box(cabinet, [0.94, 0.022, 0.45], [0, y, 0], materials.ash);
  cabinetContents(cabinet, materials);
  for (const x of [-0.25, 0.25]) {
    for (const edge of [-0.215, 0.215])
      box(cabinet, [0.024, 1.31, 0.032], [x + edge, 1.29, -0.255], materials.enamel);
    for (const y of [0.645, 1.935])
      box(cabinet, [0.45, 0.028, 0.032], [x, y, -0.255], materials.enamel);
    const glass = box(cabinet, [0.408, 1.25, 0.006], [x, 1.29, -0.248], materials.glass);
    glass.castShadow = false;
    const hingeX = x < 0 ? -0.475 : 0.475;
    for (const height of [0.88, 1.71]) {
      cylinder(cabinet, 0.009, 0.052, [hingeX, height, -0.278], materials.metal);
      box(
        cabinet,
        [0.034, 0.032, 0.004],
        [hingeX - Math.sign(hingeX) * 0.015, height, -0.278],
        materials.metal,
      );
    }
    pull(cabinet, x, 1.13, -0.295, materials);
    roundBox(cabinet, [0.478, 0.405, 0.023], [x, 0.414, -0.26], materials.enamel, 0.005);
    pull(cabinet, x, 0.46, -0.3, materials);
  }
  for (const x of [-0.42, 0.42])
    for (const z of [-0.16, 0.16])
      cylinder(cabinet, 0.024, 0.09, [x, 0.06, z], materials.deepGreen);
  cabinet.position.set(1.4, 0, 2.27);
  return cabinet;
}

export function createCabinets(materials: FurnitureMaterials): Group {
  const group = new Group();
  group.add(lowCabinet(materials), tallCabinet(materials));
  return group;
}
