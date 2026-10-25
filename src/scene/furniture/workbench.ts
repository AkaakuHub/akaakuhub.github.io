import { Group } from "three";
import { box } from "../primitives";
import { cylinder, rod, roundBox } from "./geometry";
import { createWorktopObjects } from "./worktop";
import type { FurnitureMaterials } from "./materials";
import { createDeskLamp } from "./desk-lamp";

function createStool(materials: FurnitureMaterials): Group {
  const stool = new Group();
  stool.name = "workbench-stool";
  cylinder(stool, 0.215, 0.055, [0, 0.475, 0], materials.oak);
  cylinder(stool, 0.175, 0.025, [0, 0.437, 0], materials.deepGreen);
  for (let leg = 0; leg < 3; leg++) {
    const angle = (leg * Math.PI * 2) / 3;
    const x = Math.cos(angle),
      z = Math.sin(angle);
    rod(
      stool,
      [x * 0.13, 0.43, z * 0.13],
      [x * 0.205, 0.025, z * 0.205],
      0.014,
      materials.deepGreen,
    );
    cylinder(stool, 0.02, 0.035, [x * 0.205, 0.0175, z * 0.205], materials.rubber);
    const nextAngle = angle + (Math.PI * 2) / 3;
    rod(
      stool,
      [x * 0.178, 0.17, z * 0.178],
      [Math.cos(nextAngle) * 0.178, 0.17, Math.sin(nextAngle) * 0.178],
      0.008,
      materials.deepGreen,
    );
  }
  stool.position.set(-1.04, 0, 0.45);
  return stool;
}

export function createWorkbench(materials: FurnitureMaterials): Group {
  const group = new Group();
  const workbench = new Group();
  workbench.name = "workbench";
  roundBox(workbench, [0.85, 0.052, 1.75], [0, 0.77, 0], materials.oak, 0.018);
  box(workbench, [0.79, 0.035, 1.66], [0, 0.727, 0], materials.deepGreen);
  for (const x of [-0.32, 0.32]) {
    for (const z of [-0.73, 0.73]) {
      roundBox(workbench, [0.042, 0.7, 0.042], [x, 0.365, z], materials.deepGreen, 0.005);
      cylinder(workbench, 0.028, 0.025, [x, 0.0125, z], materials.rubber);
      cylinder(workbench, 0.012, 0.015, [x, 0.048, z], materials.metal);
    }
    rod(workbench, [x, 0.22, -0.73], [x, 0.22, 0.73], 0.012, materials.deepGreen);
  }
  box(workbench, [0.64, 0.15, 0.44], [-0.025, 0.62, 0.57], materials.enamel);
  roundBox(workbench, [0.025, 0.13, 0.4], [0.31, 0.62, 0.57], materials.enamel, 0.007);
  rod(workbench, [0.345, 0.635, 0.47], [0.345, 0.635, 0.67], 0.007, materials.metal);
  for (const z of [0.47, 0.67])
    rod(workbench, [0.323, 0.635, z], [0.345, 0.635, z], 0.007, materials.metal);
  const surfaceY = 0.796;
  createWorktopObjects(workbench, materials, surfaceY);
  workbench.add(createDeskLamp(materials, surfaceY));
  workbench.position.set(-1.94, 0, 0.45);
  group.add(workbench, createStool(materials));
  return group;
}
