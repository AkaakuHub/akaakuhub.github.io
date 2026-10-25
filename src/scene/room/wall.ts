import type { Material, Object3D } from "three";
import { box } from "../primitives";

export function wallBlock(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
): void {
  const mesh = box(parent, size, position, material);
  const geometry = mesh.geometry.clone();
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index++) {
    const x = positions.getX(index) + position[0];
    const y = positions.getY(index) + position[1];
    const z = positions.getZ(index) + position[2];
    if (Math.abs(normals.getX(index)) > 0.5) uv.setXY(index, z, y);
    else if (Math.abs(normals.getY(index)) > 0.5) uv.setXY(index, x, z);
    else uv.setXY(index, x, y);
  }
  geometry.userData.metricUv = false;
  mesh.geometry = geometry;
}
