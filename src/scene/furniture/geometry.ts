import { CylinderGeometry, Mesh, Vector3 } from "three";
import type { Material, Object3D } from "three";
import { metricCylinderUv } from "../materials/uv";
import { roundedBoxGeometry } from "../geometry/rounded-box";

const cylinders = new Map<string, CylinderGeometry>();

export function roundBox(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
  radius = 0.012,
): Mesh {
  const mesh = new Mesh(roundedBoxGeometry(size, radius), material);
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
  const key = [topRadius, radius, height].join(":");
  let geometry = cylinders.get(key);
  if (!geometry) {
    geometry = new CylinderGeometry(topRadius, radius, height, 24);
    metricCylinderUv(geometry);
    cylinders.set(key, geometry);
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
