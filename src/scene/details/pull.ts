import { CatmullRomCurve3, Group, TubeGeometry, Vector3 } from "three";
import type { Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { metricBoxUv } from "../materials/uv";
import { HardwareBatch } from "./hardware";

export function windowPull(material: Material): Group {
  const result = new Group();
  result.name = "sash-pull-and-fixing-plate";
  const hardware = new HardwareBatch();
  const plate = new RoundedBoxGeometry(0.024, 0.124, 0.0015, 2, 0.0005);
  metricBoxUv(plate);
  hardware.add(plate, material, [0, 0, 0.00075]);
  for (const y of [-0.054, 0.054]) hardware.screw(material, [0, y, 0.0016]);
  const curve = new CatmullRomCurve3([
    new Vector3(0, -0.041, 0.002),
    new Vector3(0, -0.041, 0.017),
    new Vector3(0, -0.032, 0.025),
    new Vector3(0, 0.032, 0.025),
    new Vector3(0, 0.041, 0.017),
    new Vector3(0, 0.041, 0.002),
  ]);
  const handle = new TubeGeometry(curve, 32, 0.0035, 10, false);
  const uv = handle.getAttribute("uv");
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, uv.getX(index) * curve.getLength(), uv.getY(index) * Math.PI * 0.007);
  hardware.add(handle, material, [0, 0, 0]);
  hardware.finish(result);
  plate.dispose();
  handle.dispose();
  return result;
}
