import type { BufferGeometry, Mesh } from "three";

const geometries = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>();

export function orientWoodGrain(
  mesh: Mesh,
  axis: "x" | "y" | "z",
  textureAxis: "u" | "v" = "u",
): void {
  const original = mesh.geometry;
  let variants = geometries.get(original);
  if (!variants) {
    variants = new Map();
    geometries.set(original, variants);
  }
  const key = `${axis}:${textureAxis}`;
  let geometry = variants.get(key);
  if (!geometry) {
    geometry = original.clone();
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const uv = geometry.getAttribute("uv");
    for (let index = 0; index < uv.count; index++) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const z = positions.getZ(index);
      if (axis === "y") {
        if (Math.abs(normals.getY(index)) < 0.9)
          uv.setXY(index, y, Math.abs(normals.getX(index)) > 0.5 ? z : x);
      } else if (axis === "z" && Math.abs(normals.getZ(index)) < 0.9) {
        uv.setXY(index, z, Math.abs(normals.getY(index)) > 0.5 ? x : y);
      } else if (axis === "x" && Math.abs(normals.getX(index)) < 0.9) {
        uv.setXY(index, x, Math.abs(normals.getY(index)) > 0.5 ? z : y);
      }
      if (textureAxis === "v") uv.setXY(index, uv.getY(index), uv.getX(index));
    }
    variants.set(key, geometry);
  }
  mesh.geometry = geometry;
}
