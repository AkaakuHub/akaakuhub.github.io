import type { PbrMaps } from "../materials/library";
import { Group, MeshBasicMaterial, MeshPhysicalMaterial } from "three";
import { box, surface } from "../primitives";
import { HardwareBatch } from "../details/hardware";
import { windowPull } from "../details/pull";
import { createCurtains } from "./curtains";
import type { ArchitectureMaterials } from "./materials/architecture";

export function createWindow(materials: ArchitectureMaterials, fabric: PbrMaps): Group {
  const window = new Group();
  const frame = materials.frame;
  const steel = surface("#a9afa7", 0.28, 0.82);
  const hardware = new HardwareBatch();
  const gasket = surface("#696e66", 0.84);
  const sill = materials.sill;
  const skyBackdrop = box(
    window,
    [0.04, 10, 14],
    [-9, 3, 0],
    new MeshBasicMaterial({ color: "#c6dded" }),
  );
  skyBackdrop.name = "world-sky";
  skyBackdrop.castShadow = false;
  skyBackdrop.receiveShadow = false;
  const masonry = materials.wall;
  const exterior = box(window, [0.55, 1.25, 7.4], [-7.6, 0.15, 0.3], masonry);
  exterior.castShadow = false;
  for (let z = -2.9; z < 3.3; z += 0.75) {
    const pane = box(window, [0.03, 0.56, 0.44], [-7.3, 0.32, z], surface("#637d82", 0.33));
    pane.castShadow = false;
  }
  const glass = new MeshPhysicalMaterial({
    color: "#e8f0eb",
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  for (const [center, width] of [
    [-1.28, 1.3],
    [0, 1.26],
    [1.28, 1.3],
  ] as const) {
    const pane = box(window, [0.008, 1.48, width - 0.02], [-2.626, 1.785, center], glass);
    pane.castShadow = false;
    pane.receiveShadow = false;
    for (const edge of [-width / 2 + 0.018, width / 2 - 0.018]) {
      box(window, [0.075, 1.46, 0.018], [-2.572, 1.785, center + edge], gasket);
    }
    box(window, [0.07, 0.028, width - 0.04], [-2.568, 2.19, center], frame);
    const handle = windowPull(steel);
    handle.position.set(-2.4999, 1.65, center + width / 2);
    handle.rotation.y = Math.PI / 2;
    window.add(handle);
  }
  for (const y of [1.02, 2.55]) {
    box(window, [0.16, 0.075, 3.93], [-2.57, y, 0], frame);
  }
  for (const z of [-1.93, -0.63, 0.63, 1.93]) {
    box(window, [0.14, 1.6, 0.055], [-2.57, 1.785, z], frame);
    for (const y of [1.075, 2.49]) hardware.screw(steel, [-2.4999, y, z], [0, Math.PI / 2, 0]);
  }
  box(window, [0.32, 0.055, 4.13], [-2.43, 0.965, 0], sill);
  box(window, [0.055, 0.115, 4.1], [-2.31, 0.9, 0], sill);
  for (const x of [-2.54, -2.58]) box(window, [0.002, 0.006, 3.78], [x, 1.0605, 0], steel);
  hardware.finish(window);
  const dust = surface("#8a8170", 0.99);
  box(window, [0.018, 0.004, 3.82], [-2.53, 0.996, 0], dust);
  window.add(createCurtains(fabric));
  return window;
}
