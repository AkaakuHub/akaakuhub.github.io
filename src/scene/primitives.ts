import { BoxGeometry, Mesh } from "three";
import type { Material, Object3D } from "three";
import { metricBoxUv } from "./materials/uv";

export function box(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
): Mesh<BoxGeometry, Material> {
  const geometry = new BoxGeometry(...size);
  metricBoxUv(geometry);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
