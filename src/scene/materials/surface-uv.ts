import type { BufferGeometry, Matrix4 } from "three";

export function offsetSurfaceUv(geometry: BufferGeometry, world: Matrix4): void {
  if (geometry.userData.metricUv !== true) return;
  const uv = geometry.getAttribute("uv");
  const elements = world.elements;
  const u = elements[12] * 0.73 + elements[13] * 0.41 + elements[14] * 0.37;
  const v = elements[12] * 0.29 + elements[13] * 0.67 + elements[14] * 0.83;
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, uv.getX(index) + u, uv.getY(index) + v);
}
