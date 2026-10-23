import { tubeGeometry } from "../../geometry/curves";
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Group,
  Mesh,
  Path,
  Shape,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Material } from "three";
import type { FurnitureMaterials } from "../materials";

function bodyOutline(): Shape {
  const shape = new Shape();
  shape.moveTo(0, 0.025);
  shape.bezierCurveTo(-0.23, 0.02, -0.255, 0.18, -0.19, 0.285);
  shape.bezierCurveTo(-0.125, 0.38, -0.158, 0.365, -0.17, 0.445);
  shape.bezierCurveTo(-0.19, 0.57, -0.068, 0.59, 0, 0.575);
  shape.bezierCurveTo(0.068, 0.59, 0.19, 0.57, 0.17, 0.445);
  shape.bezierCurveTo(0.158, 0.365, 0.125, 0.38, 0.19, 0.285);
  shape.bezierCurveTo(0.255, 0.18, 0.23, 0.02, 0, 0.025);
  shape.closePath();
  return shape;
}

function panel(shape: Shape, depth: number, z: number, material: Material): Mesh {
  const mesh = new Mesh(
    new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.0015,
      bevelThickness: 0.0008,
      curveSegments: 28,
    }),
    material,
  );
  mesh.position.z = z;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function guitarBody(materials: FurnitureMaterials): Group {
  const body = new Group();
  body.name = "hollow-acoustic-guitar-body";
  const soundboard = bodyOutline();
  const soundhole = new Path();
  soundhole.absarc(0, 0.408, 0.058, 0, Math.PI * 2, true);
  soundboard.holes.push(soundhole);
  const top = panel(soundboard, 0.004, -0.004, materials.amber);
  top.name = "guitar-soundboard-with-open-soundhole";
  const woodUv = top.geometry.getAttribute("uv");
  for (let index = 0; index < woodUv.count; index++)
    woodUv.setXY(index, woodUv.getY(index), -woodUv.getX(index));
  const rim = bodyOutline();
  const innerOutline = bodyOutline()
    .getPoints(48)
    .map((point) => new Vector2(point.x * 0.965, (point.y - 0.3) * 0.965 + 0.3));
  rim.holes.push(new Path(innerOutline));
  const sides = panel(rim, 0.066, 0, materials.walnut);
  sides.name = "guitar-inner-and-outer-sidewall";
  const back = panel(bodyOutline(), 0.003, 0.066, materials.walnut);
  back.name = "guitar-back-panel";
  body.add(top, sides, back);
  const contour = bodyOutline().getPoints(48);
  contour.pop();
  for (const z of [-0.0035, 0.069]) {
    const edge = new CatmullRomCurve3(
      contour.map((point) => new Vector3(point.x, point.y, z)),
      true,
      "centripetal",
    );
    const binding = new Mesh(tubeGeometry(edge, 160, 0.0015, 6, true), materials.ivory);
    binding.castShadow = binding.receiveShadow = true;
    body.add(binding);
  }
  const rosette = new Mesh(new TorusGeometry(0.064, 0.0016, 8, 64), materials.ivory);
  rosette.position.set(0, 0.408, -0.0051);
  body.add(rosette);
  const innerRing = new Mesh(new TorusGeometry(0.06, 0.0007, 6, 64), materials.walnut);
  innerRing.position.set(0, 0.408, -0.0051);
  body.add(innerRing);
  return body;
}
