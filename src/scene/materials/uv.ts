import type { BufferGeometry, CylinderGeometry } from "three";

export function metricBoxUv(geometry: BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (const group of geometry.groups) {
    for (let offset = group.start; offset < group.start + group.count; offset++) {
      const vertex = geometry.index ? geometry.index.getX(offset) : offset;
      const x = positions.getX(vertex);
      const y = positions.getY(vertex);
      const z = positions.getZ(vertex);
      switch (group.materialIndex) {
        case 0:
          uv.setXY(vertex, -z, y);
          break;
        case 1:
          uv.setXY(vertex, z, y);
          break;
        case 2:
          uv.setXY(vertex, x, -z);
          break;
        case 3:
          uv.setXY(vertex, x, z);
          break;
        case 4:
          uv.setXY(vertex, x, y);
          break;
        case 5:
          uv.setXY(vertex, -x, y);
          break;
        default:
          throw new Error("直方体の面を特定できませんでした。");
      }
    }
  }
}

export function metricCylinderUv(geometry: CylinderGeometry): void {
  const uv = geometry.getAttribute("uv");
  const positions = geometry.getAttribute("position");
  const originalUv = uv.clone();
  for (const group of geometry.groups) {
    for (let offset = group.start; offset < group.start + group.count; offset++) {
      const index = geometry.index!.getX(offset);
      if (group.materialIndex === 0) {
        uv.setXY(
          index,
          originalUv.getX(index) *
            Math.PI *
            2 *
            Math.max(geometry.parameters.radiusBottom, geometry.parameters.radiusTop),
          positions.getY(index),
        );
      } else {
        uv.setXY(index, positions.getX(index), positions.getZ(index));
      }
    }
  }
}
