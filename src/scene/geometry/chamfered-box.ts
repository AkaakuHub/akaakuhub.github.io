import { BufferGeometry, Float32BufferAttribute, Mesh, Vector3 } from "three";
import type { Material, Object3D } from "three";

const geometries = new Map<string, BufferGeometry>();

export function chamferedBoxGeometry(
  size: readonly [number, number, number],
  bevel: number,
): BufferGeometry {
  if (
    size.some((value) => !Number.isFinite(value) || value <= 0) ||
    !Number.isFinite(bevel) ||
    bevel <= 0 ||
    bevel * 2 >= Math.min(...size)
  )
    throw new Error("面取りした部材の寸法が不正です。");
  const key = [...size, bevel].join(":");
  const existing = geometries.get(key);
  if (existing) return existing;
  const half = new Vector3(...size).multiplyScalar(0.5);
  const inner = half.clone().subScalar(bevel);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  function face(points: readonly [Vector3, Vector3, Vector3, ...Vector3[]], normal: Vector3): void {
    const cross = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    const ordered = cross.dot(normal) < 0 ? [...points].reverse() : points;
    const start = positions.length / 3;
    for (const point of ordered) {
      positions.push(...point.toArray());
      normals.push(...normal.toArray());
      if (Math.abs(normal.x) >= Math.abs(normal.y) && Math.abs(normal.x) >= Math.abs(normal.z))
        uvs.push(-Math.sign(normal.x) * point.z, point.y);
      else if (Math.abs(normal.y) >= Math.abs(normal.z))
        uvs.push(point.x, -Math.sign(normal.y) * point.z);
      else uvs.push(Math.sign(normal.z) * point.x, point.y);
    }
    for (let index = 1; index < ordered.length - 1; index++)
      indices.push(start, start + index, start + index + 1);
  }

  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;
    for (const sign of [-1, 1]) {
      const center = new Vector3().setComponent(axis, sign * half.getComponent(axis));
      const a = new Vector3().setComponent(u, inner.getComponent(u));
      const b = new Vector3().setComponent(v, inner.getComponent(v));
      face(
        [
          center.clone().sub(a).sub(b),
          center.clone().add(a).sub(b),
          center.clone().add(a).add(b),
          center.clone().sub(a).add(b),
        ],
        new Vector3().setComponent(axis, sign),
      );
    }
    for (const signU of [-1, 1]) {
      for (const signV of [-1, 1]) {
        const a = new Vector3()
          .setComponent(u, signU * half.getComponent(u))
          .setComponent(v, signV * inner.getComponent(v));
        const b = new Vector3()
          .setComponent(u, signU * inner.getComponent(u))
          .setComponent(v, signV * half.getComponent(v));
        const along = new Vector3().setComponent(axis, inner.getComponent(axis));
        face(
          [a.clone().sub(along), a.clone().add(along), b.clone().add(along), b.clone().sub(along)],
          new Vector3().setComponent(u, signU).setComponent(v, signV).normalize(),
        );
      }
    }
  }
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1]) {
        const center = new Vector3(x * inner.x, y * inner.y, z * inner.z);
        face(
          [
            center.clone().add(new Vector3(x * bevel, 0, 0)),
            center.clone().add(new Vector3(0, y * bevel, 0)),
            center.clone().add(new Vector3(0, 0, z * bevel)),
          ],
          new Vector3(x, y, z).normalize(),
        );
      }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.userData.metricUv = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometries.set(key, geometry);
  return geometry;
}

export function chamferedBox(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
  bevel: number,
): Mesh {
  const mesh = new Mesh(chamferedBoxGeometry(size, bevel), material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
