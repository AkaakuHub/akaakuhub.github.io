import { CylinderGeometry, Mesh, SphereGeometry, Vector3 } from "three";
import type { Material, Object3D } from "three";
import { metricBoxUv } from "../materials/uv";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function roundBox(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
  radius = 0.012,
): Mesh {
  const geometry = new RoundedBoxGeometry(...size, 2, radius);
  metricBoxUv(geometry);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(
  parent: Object3D,
  radius: number,
  height: number,
  position: readonly [number, number, number],
  material: Material,
  topRadius = radius,
): Mesh {
  const geometry = new CylinderGeometry(topRadius, radius, height, 24);
  const uv = geometry.getAttribute("uv");
  const positions = geometry.getAttribute("position");
  const originalUv = uv.clone();
  for (const group of geometry.groups) {
    for (let offset = group.start; offset < group.start + group.count; offset++) {
      const index = geometry.index!.getX(offset);
      if (group.materialIndex === 0) {
        uv.setXY(
          index,
          originalUv.getX(index) * Math.PI * 2 * Math.max(radius, topRadius),
          positions.getY(index),
        );
      } else {
        uv.setXY(index, positions.getX(index), positions.getZ(index));
      }
    }
  }
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function rod(
  parent: Object3D,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  radius: number,
  material: Material,
): Mesh {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const mesh = cylinder(parent, radius, direction.length(), [0, 0, 0], material);
  mesh.position.copy(start.add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function leaf(
  parent: Object3D,
  position: readonly [number, number, number],
  angle: number,
  material: Material,
): void {
  const mesh = new Mesh(new SphereGeometry(1, 12, 8), material);
  mesh.scale.set(0.027, 0.085, 0.012);
  mesh.position.set(...position);
  mesh.rotation.z = angle;
  mesh.castShadow = true;
  parent.add(mesh);
}
