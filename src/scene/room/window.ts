import { Group, MeshBasicMaterial, MeshPhysicalMaterial } from "three";
import { box, surface } from "../primitives";

export function createWindow(): Group {
  const window = new Group();
  const aluminum = surface("#c6c8bf", 0.32, 0.7);
  const edge = surface("#777e76", 0.6, 0.45);
  const sky = new MeshBasicMaterial({ color: "#c6dded" });
  box(window, [0.04, 5.5, 8.5], [-5.5, 2.4, 0], sky).castShadow = false;
  const exterior = surface("#c9c8b8", 0.95);
  const outside = box(window, [0.9, 1.4, 6], [-5.2, 0.5, -0.7], exterior);
  outside.castShadow = false;
  for (let z = -3.2; z < 2; z += 0.8) {
    box(window, [0.04, 0.65, 0.48], [-4.72, 0.65, z], surface("#788d91", 0.3)).castShadow = false;
  }
  const glass = new MeshPhysicalMaterial({
    color: "#d2e3e4",
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: 2,
  });
  const pane = box(window, [0.012, 1.5, 3.75], [-2.635, 1.78, 0], glass);
  pane.castShadow = false;
  for (const height of [1.01, 2.55]) {
    box(window, [0.13, 0.065, 3.92], [-2.58, height, 0], aluminum);
    box(window, [0.15, 0.022, 3.92], [-2.52, height + 0.025, 0], edge);
  }
  for (const z of [-1.93, -0.64, 0.64, 1.93]) {
    box(window, [0.12, 1.57, 0.055], [-2.58, 1.78, z], aluminum);
  }
  box(window, [0.12, 0.045, 3.85], [-2.56, 1.6, 0], aluminum);
  box(window, [0.28, 0.055, 4.03], [-2.48, 0.96, 0], surface("#dad5c3", 0.65));
  for (const z of [-0.68, 0.68]) {
    box(window, [0.045, 0.14, 0.035], [-2.49, 1.72, z], edge);
  }
  return window;
}
