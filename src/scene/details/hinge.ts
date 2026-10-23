import { ExtrudeGeometry, Group, LatheGeometry, Path, Shape, Vector2 } from "three";
import type { Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { metricBoxUv } from "../materials/uv";
import { HardwareBatch } from "./hardware";

export function hinge(material: Material): Group {
  const result = new Group();
  result.name = "five-knuckle-butt-hinge";
  const hardware = new HardwareBatch();
  const plate = new RoundedBoxGeometry(0.02, 0.094, 0.0016, 2, 0.00045);
  metricBoxUv(plate);
  for (const side of [-1, 1]) {
    hardware.add(plate, material, [side * 0.014, 0, 0.0008]);
    for (const y of [-0.031, 0.031]) hardware.screw(material, [side * 0.014, y, 0.0017]);
  }
  const circle = new Shape();
  circle.absarc(0, 0, 0.0042, 0, Math.PI * 2, false);
  const bore = new Path();
  bore.absarc(0, 0, 0.0023, 0, Math.PI * 2, true);
  circle.holes.push(bore);
  const knuckle = new ExtrudeGeometry(circle, {
    depth: 0.0175,
    bevelEnabled: true,
    bevelThickness: 0.00015,
    bevelSize: 0.00015,
    bevelSegments: 1,
    curveSegments: 16,
    steps: 1,
  });
  knuckle.rotateX(-Math.PI / 2);
  knuckle.translate(0, -0.00875, 0);
  const tab = new RoundedBoxGeometry(0.009, 0.0175, 0.0016, 1, 0.00025);
  metricBoxUv(tab);
  for (let index = 0; index < 5; index++) {
    const y = (index - 2) * 0.0189;
    const side = index % 2 === 0 ? -1 : 1;
    hardware.add(knuckle, material, [0, y, 0.003]);
    hardware.add(tab, material, [side * 0.0035, y, 0.0008]);
  }
  const profile = [
    new Vector2(0, -0.0505),
    new Vector2(0.00215, -0.0505),
    new Vector2(0.00215, 0.0485),
    new Vector2(0.0043, 0.0485),
    new Vector2(0.0043, 0.0503),
    new Vector2(0.0033, 0.052),
    new Vector2(0, 0.0526),
  ];
  const pin = new LatheGeometry(profile, 24);
  const uv = pin.getAttribute("uv");
  const positions = pin.getAttribute("position");
  for (let index = 0; index < positions.count; index++)
    uv.setXY(index, uv.getX(index) * Math.PI * 0.0086, positions.getY(index));
  hardware.add(pin, material, [0, 0, 0.003]);
  hardware.finish(result);
  plate.dispose();
  knuckle.dispose();
  tab.dispose();
  pin.dispose();
  return result;
}
