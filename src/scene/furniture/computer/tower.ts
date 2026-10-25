import {
  DoubleSide,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import { box } from "../../primitives";
import { roundBox } from "../geometry";
import { caseFan } from "./fan";
import { computerInterior } from "./interior";
import { ventPanel } from "./vent";

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
  for (const x of [-0.109, 0.109]) box(tower, [0.012, 0.009, 0.43], [x, 0.4695, 0], white);
  for (const z of [-0.209, 0.209]) box(tower, [0.206, 0.009, 0.012], [0, 0.4695, z], white);
  box(tower, [0.009, 0.438, 0.43], [0.1105, 0.247, 0], white);
  for (const x of [-0.11, 0.11])
    for (const z of [-0.209, 0.209]) box(tower, [0.01, 0.438, 0.012], [x, 0.247, z], white);
  box(tower, [0.218, 0.063, 0.414], [0, 0.063, 0], white);
  const power = new Mesh(
    new CylinderGeometry(0.012, 0.012, 0.004, 24),
    new MeshStandardMaterial({
      color: "#303b36",
      emissive: "#8dc7ac",
      emissiveIntensity: 0,
      roughness: 0.45,
    }),
  );
  power.name = "computer-power-button";
  power.rotation.x = Math.PI / 2;
  power.position.set(0, 0.063, 0.219);
  tower.add(power);
  for (const y of [0.159, 0.283, 0.407]) {
    const fan = caseFan(white, white);
    fan.position.set(0, y, 0.201);
    tower.add(fan);
  }
  for (const x of [-0.104, 0.104]) box(tower, [0.008, 0.372, 0.013], [x, 0.283, 0.213], white);
  for (const z of [-0.213, 0.213]) {
    box(tower, [0.23, 0.016, 0.008], [0, 0.1, z], white);
    box(tower, [0.23, 0.012, 0.008], [0, 0.468, z], white);
  }
  const front = ventPanel(0.206, 0.36);
  front.position.set(0, 0.286, 0.218);
  const back = ventPanel(0.206, 0.424);
  back.position.set(0, 0.25, -0.218);
  back.rotation.y = Math.PI;
  const top = ventPanel(0.206, 0.404);
  top.position.set(0, 0.4741, 0);
  top.rotation.x = -Math.PI / 2;
  tower.add(front, back, top);
  for (const x of [-0.056, 0.056]) box(tower, [0.008, 0.118, 0.02], [x, 0.332, -0.207], white);
  box(tower, [0.06, 0.135, 0.009], [0.073, 0.317, -0.217], metal);
  for (let index = 0; index < 4; index++)
    box(tower, [0.034, 0.009, 0.003], [0.073, 0.28 + index * 0.023, -0.223], dark);
  for (let index = 0; index < 3; index++)
    box(tower, [0.105, 0.012, 0.009], [-0.015, 0.142 + index * 0.019, -0.22], metal);
  box(tower, [0.17, 0.065, 0.009], [0, 0.063, -0.215], dark);
  const glass = new MeshPhysicalMaterial({
    color: "#d9e0df",
    transparent: true,
    opacity: 0.1,
    roughness: 0.12,
    side: DoubleSide,
    forceSinglePass: true,
    depthWrite: false,
  });
  const panel = new Mesh(new PlaneGeometry(0.402, 0.425), glass);
  panel.rotation.y = -Math.PI / 2;
  panel.position.set(-0.115, 0.25, 0);
  panel.castShadow = false;
  tower.add(panel);
  tower.add(computerInterior(white, metal, dark));
  return tower;
}
