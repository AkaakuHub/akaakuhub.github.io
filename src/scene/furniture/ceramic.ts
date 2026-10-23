import {
  CatmullRomCurve3,
  Group,
  LatheGeometry,
  Mesh,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Material } from "three";

export function ceramicMug(material: Material, height: number, radius: number): Group {
  const cup = new Group();
  cup.name = "hollow-ceramic-mug";
  const outline: readonly (readonly [number, number])[] = [
    [0, 0.045],
    [0.65, 0.045],
    [0.65, 0],
    [0.77, 0],
    [0.82, 0.05],
    [0.88, 0.12],
    [0.98, 0.42],
    [1, 0.94],
    [0.99, 0.99],
    [0.95, 1],
    [0.91, 0.98],
    [0.9, 0.93],
    [0.87, 0.2],
    [0.77, 0.12],
    [0, 0.12],
  ];
  const profile = outline.map(([x, y]) => new Vector2(x * radius, y * height));
  const vessel = new Mesh(new LatheGeometry(profile, 48), material);
  vessel.name = "mug-inner-and-outer-wall";
  vessel.castShadow = vessel.receiveShadow = true;
  const curve = new CatmullRomCurve3([
    new Vector3(radius * 0.93, height * 0.78, 0),
    new Vector3(radius * 1.54, height * 0.79, 0),
    new Vector3(radius * 1.79, height * 0.54, 0),
    new Vector3(radius * 1.55, height * 0.27, 0),
    new Vector3(radius * 0.92, height * 0.26, 0),
  ]);
  const handle = new Mesh(new TubeGeometry(curve, 28, radius * 0.115, 10, false), material);
  handle.name = "mug-open-handle";
  handle.castShadow = handle.receiveShadow = true;
  cup.add(vessel, handle);
  return cup;
}
