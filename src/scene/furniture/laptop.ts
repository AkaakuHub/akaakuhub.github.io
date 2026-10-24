import { Group, MeshStandardMaterial } from "three";
import { box } from "../primitives";
import { cylinder, roundBox } from "./geometry";
import type { FurnitureMaterials } from "./materials";

export function laptop(materials: FurnitureMaterials): Group {
  const computer = new Group();
  computer.name = "laptop";
  const aluminum = new MeshStandardMaterial({ color: "#8f969c", metalness: 0.85, roughness: 0.32 });
  const screen = new MeshStandardMaterial({ color: "#101820", metalness: 0.15, roughness: 0.2 });
  for (const x of [-0.12, 0.12])
    for (const z of [-0.08, 0.08])
      cylinder(computer, 0.009, 0.003, [x, 0.0015, z], materials.rubber);
  roundBox(computer, [0.325, 0.014, 0.225], [0, 0.01, 0], aluminum, 0.004);
  roundBox(computer, [0.283, 0.001, 0.093], [0, 0.0172, -0.025], materials.plasticGraphite, 0.002);
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 14; column++) {
      roundBox(
        computer,
        [0.017, 0.0015, 0.014],
        [-0.129 + column * 0.0198, 0.0185, -0.061 + row * 0.018],
        materials.graphite,
        0.001,
      );
    }
  }
  roundBox(computer, [0.09, 0.0005, 0.048], [0, 0.0174, 0.067], materials.metal, 0.003);
  const hinge = cylinder(computer, 0.006, 0.26, [0, 0.017, -0.102], materials.graphite);
  hinge.rotation.z = Math.PI / 2;
  const lid = new Group();
  lid.position.set(0, 0.018, -0.103);
  lid.rotation.x = -0.24;
  roundBox(lid, [0.325, 0.207, 0.009], [0, 0.1035, 0], aluminum, 0.004);
  box(lid, [0.304, 0.181, 0.001], [0, 0.106, 0.005], screen);
  cylinder(lid, 0.0015, 0.001, [0, 0.201, 0.0055], materials.plasticGraphite).rotation.x =
    Math.PI / 2;
  computer.add(lid);
  return computer;
}
