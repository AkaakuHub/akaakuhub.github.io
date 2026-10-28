import { BufferGeometry, Euler, ExtrudeGeometry, Matrix4, Quaternion, Shape, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { Key } from "./layout";

export const pitch = 0.0185;
const keyHeight = 0.0095;
const geometries = new Map<string, BufferGeometry>();

export function keyTransform(key: Key): Matrix4 {
  const center = key.row + key.rows / 2;
  return new Matrix4().compose(
    new Vector3(
      (key.x + key.units / 2 - 9.25) * pitch,
      0.012 + (6.5 - center) * 0.0006 + keyHeight / 2,
      (center - 3.25) * pitch,
    ),
    new Quaternion().setFromEuler(new Euler((key.row - 3.5) * -0.025, 0, 0)),
    new Vector3(1, 1, 1),
  );
}

export function topHeight(key: Key, x: number, z: number): number {
  if (key.shape === "enter") return keyHeight / 2;
  const width = key.units * pitch - 0.0015;
  const depth = pitch - 0.0015;
  const curve = Math.max(0, 1 - (x / (width / 2)) ** 2) * Math.max(0, 1 - (z / (depth / 2)) ** 2);
  return keyHeight / 2 + (key.shape === "space" ? 0.0005 : -0.001) * curve;
}

export function keycapGeometry(key: Key): BufferGeometry {
  const name = [key.units, key.rows, key.shape ?? ""].join(":");
  const existing = geometries.get(name);
  if (existing) return existing;
  const source = createKeycap(key);
  const transferable = new BufferGeometry().copy(source);
  const geometry = mergeVertices(transferable, 0.0000001);
  transferable.dispose();
  source.dispose();
  geometries.set(name, geometry);
  return geometry;
}

function createKeycap(key: Key): BufferGeometry {
  const width = key.units * pitch - 0.0015;
  const depth = key.rows * pitch - 0.0015;
  if (key.shape === "enter") {
    const shape = new Shape();
    shape.moveTo(-width / 2, depth / 2);
    shape.lineTo(width / 2, depth / 2);
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(-width / 2 + pitch / 4, -depth / 2);
    shape.lineTo(-width / 2 + pitch / 4, 0);
    shape.lineTo(-width / 2, 0);
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, {
      depth: keyHeight - 0.002,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
    });
    return geometry.rotateX(-Math.PI / 2).translate(0, 0.001 - keyHeight / 2, 0);
  }
  const geometry = new RoundedBoxGeometry(width, keyHeight, depth, 1, 0.0012);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index++) {
    if (positions.getY(index) < keyHeight / 2 - 0.00001) continue;
    positions.setY(index, topHeight(key, positions.getX(index), positions.getZ(index)));
  }
  geometry.computeVertexNormals();
  return geometry;
}
