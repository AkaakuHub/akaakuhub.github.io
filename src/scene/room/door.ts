import type { PropMaterials } from "../materials/props";
import type { MetalMaterials } from "../materials/metal";
import {
  BoxGeometry,
  CatmullRomCurve3,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { HardwareBatch, metricCylinderGeometry } from "../details/hardware";
import { hinge } from "../details/hinge";
import { metricBoxUv } from "../materials/uv";
import { box } from "../primitives";
import type { ArchitectureMaterials } from "./materials/architecture";

export function createDoor(
  materials: ArchitectureMaterials,
  metals: MetalMaterials,
  props: PropMaterials,
): Group {
  const door = new Group();
  door.position.set(2.51, 0, 0.95);
  door.name = "room-door";
  const pivot = new Group();
  pivot.name = "room-door-pivot";
  pivot.position.set(-0.007, 0, 0.5);
  const leaf = new Group();
  leaf.name = "room-door-leaf";
  leaf.position.set(0.007, 0, -0.5);
  pivot.add(leaf);
  door.add(pivot);
  const light = new Mesh(
    new BoxGeometry(1.12, 2.28, 0.12),
    new MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  );
  light.material.color.multiplyScalar(12);
  light.name = "room-door-light";
  light.position.set(0.12, 1.13, 0);
  light.rotation.y = -Math.PI / 2;
  light.visible = false;
  door.add(light);
  const wood = materials.door;
  const trim = materials.trim;
  const gasket = metals.rubber;
  const steel = metals.steel;
  const hardware = new HardwareBatch();
  const frameHardware = new HardwareBatch();
  for (const z of [-0.54, 0.54]) {
    box(door, [0.14, 2.24, 0.075], [0, 1.12, z], trim);
  }
  box(door, [0.14, 0.075, 1.16], [0, 2.25, 0], trim);
  box(leaf, [0.06, 1.17, 1.0], [0.027, 0.6, 0], wood);
  box(leaf, [0.06, 0.17, 1.0], [0.027, 2.13, 0], wood);
  box(leaf, [0.06, 0.86, 0.26], [0.027, 1.62, -0.37], wood);
  box(leaf, [0.06, 0.86, 0.2], [0.027, 1.62, 0.4], wood);
  const glass = props.frostedGlass;
  const paneGeometry = new BoxGeometry(0.012, 0.812, 0.512, 1, 17, 11);
  metricBoxUv(paneGeometry);
  const pane = new Mesh(paneGeometry, glass);
  pane.position.set(-0.023, 1.62, 0.03);
  pane.receiveShadow = true;
  leaf.add(pane);
  for (const z of [-0.24, 0.3]) {
    box(leaf, [0.028, 0.86, 0.027], [-0.027, 1.62, z], trim);
  }
  for (const y of [1.2, 2.04]) {
    box(leaf, [0.028, 0.027, 0.57], [-0.027, y, 0.03], trim);
  }
  const plate = new RoundedBoxGeometry(0.002, 0.22, 0.075, 2, 0.0007);
  metricBoxUv(plate);
  hardware.add(plate, steel, [-0.004, 0.985, -0.35]);
  for (const y of [0.9, 1.07]) hardware.screw(steel, [-0.0051, y, -0.35], [0, -Math.PI / 2, 0]);
  const collar = metricCylinderGeometry(0.0205, 0.009);
  hardware.add(collar, steel, [-0.0095, 1.025, -0.35], [0, 0, Math.PI / 2]);
  const curve = new CatmullRomCurve3([
    new Vector3(-0.015, 1.025, -0.35),
    new Vector3(-0.081, 1.025, -0.35),
    new Vector3(-0.102, 1.025, -0.332),
    new Vector3(-0.104, 1.025, -0.23),
  ]);
  const lever = new TubeGeometry(curve, 24, 0.0105, 12, false);
  const uv = lever.getAttribute("uv");
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, uv.getX(index) * curve.getLength(), uv.getY(index) * Math.PI * 0.021);
  hardware.add(lever, steel, [0, 0, 0]);
  const end = metricCylinderGeometry(0.0105, 0.002);
  hardware.add(end, steel, [-0.104, 1.025, -0.229], [Math.PI / 2, 0, 0]);
  plate.dispose();
  collar.dispose();
  lever.dispose();
  end.dispose();
  const kickPlate = new RoundedBoxGeometry(0.0015, 0.16, 0.81, 1, 0.0005);
  metricBoxUv(kickPlate);
  hardware.add(kickPlate, steel, [-0.00375, 0.15, 0]);
  kickPlate.dispose();
  box(leaf, [0.025, 0.025, 1.01], [-0.015, 0.017, 0], gasket);
  for (const y of [0.45, 1.1, 1.95]) {
    const joint = hinge(steel);
    joint.position.set(-0.007, y, 0.5);
    joint.rotation.y = -Math.PI / 2;
    door.add(joint);
  }
  for (const y of [0.1, 0.2])
    for (const z of [-0.34, 0.34]) hardware.screw(steel, [-0.0046, y, z], [0, -Math.PI / 2, 0]);
  for (const y of [0.3, 2.1])
    for (const z of [-0.54, 0.54])
      frameHardware.screw(steel, [-0.0702, y, z], [0, -Math.PI / 2, 0]);
  const switchPlate = box(door, [0.025, 0.115, 0.07], [-0.011, 1.16, -0.8], metals.ivory);
  switchPlate.name = "room-light-switch";
  const rocker = box(switchPlate, [0.016, 0.06, 0.04], [-0.018, 0, 0], metals.ivory);
  rocker.name = "room-light-switch-rocker";
  rocker.rotation.z = -0.16;
  const tape = new MeshStandardMaterial({
    color: "#bfd59a",
    roughness: 0.92,
    emissive: "#8edd78",
    emissiveIntensity: 0.06,
  });
  for (const z of [-0.027, 0.027]) {
    const strip = box(switchPlate, [0.0006, 0.078, 0.006], [-0.0129, 0, z], tape);
    strip.name = "switch-phosphorescent-tape";
    strip.castShadow = false;
  }
  for (const y of [1.116, 1.204])
    frameHardware.screw(steel, [-0.0237, y, -0.8], [0, -Math.PI / 2, 0]);
  hardware.finish(leaf);
  frameHardware.finish(door);
  return door;
}
