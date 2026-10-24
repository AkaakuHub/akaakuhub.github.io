import { BoxGeometry, Mesh } from "three";
import type { Material, Object3D } from "three";
import { metricBoxUv } from "./materials/uv";

const geometries = new Map<string, BoxGeometry>();

export function box(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
): Mesh<BoxGeometry, Material> {
  const key = size.join(":");
  let geometry = geometries.get(key);
  if (!geometry) {
    const segments = size.map((length) => Math.max(1, Math.ceil(length / 0.18)));
    geometry = new BoxGeometry(...size, segments[0], segments[1], segments[2]);
    metricBoxUv(geometry);
    geometries.set(key, geometry);
  }
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
