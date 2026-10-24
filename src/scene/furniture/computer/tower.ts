import { DoubleSide, Group, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { box } from "../../primitives";
import { roundBox } from "../geometry";
import { caseFan } from "./fan";
import { computerInterior } from "./interior";

export function desktopTower(): Group {
  const tower = new Group();
  tower.name = "white-desktop-tower";
  const white = new MeshStandardMaterial({ color: "#eeeef0", roughness: 0.62 });
  const metal = new MeshStandardMaterial({ color: "#b8bdbe", roughness: 0.48, metalness: 1 });
  const dark = new MeshStandardMaterial({ color: "#24292b", roughness: 0.8 });
  const rubber = new MeshStandardMaterial({ color: "#27292a", roughness: 1 });
  for (const x of [-0.085, 0.085])
    for (const z of [-0.16, 0.16])
      roundBox(tower, [0.035, 0.018, 0.045], [x, 0.009, z], rubber, 0.004);
  box(tower, [0.23, 0.014, 0.43], [0, 0.025, 0], white);
  box(tower, [0.23, 0.009, 0.43], [0, 0.4695, 0], white);
  box(tower, [0.009, 0.438, 0.43], [0.1105, 0.247, 0], white);
  for (const x of [-0.11, 0.11])
    for (const z of [-0.209, 0.209]) box(tower, [0.01, 0.438, 0.012], [x, 0.247, z], white);
  box(tower, [0.218, 0.063, 0.414], [0, 0.063, 0], white);
  for (const y of [0.159, 0.283, 0.407]) {
    const fan = caseFan(white, white);
    fan.position.set(0.017, y, 0.201);
    tower.add(fan);
  }
  for (const x of [-0.104, 0.104]) box(tower, [0.008, 0.372, 0.013], [x, 0.283, 0.213], white);
  const glass = new MeshPhysicalMaterial({
    color: "#d9e0df",
    transparent: true,
    opacity: 0.1,
    roughness: 0.12,
    side: DoubleSide,
    depthWrite: false,
  });
  const panel = box(tower, [0.003, 0.425, 0.402], [-0.115, 0.25, 0], glass);
  panel.castShadow = false;
  tower.add(computerInterior(white, metal, dark));
  return tower;
}
