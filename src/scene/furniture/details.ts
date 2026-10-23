import { CylinderGeometry, Mesh, SphereGeometry, Vector3 } from "three";
import type { Material, Object3D } from "three";

export function cylinder(
  parent: Object3D,
  radius: number,
  height: number,
  position: readonly [number, number, number],
  material: Material,
  topRadius = radius,
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(topRadius, radius, height, 16), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function rail(
  parent: Object3D,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  radius: number,
  material: Material,
): void {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const mesh = cylinder(parent, radius, direction.length(), [0, 0, 0], material);
  mesh.position.copy(start.add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
}

export function leaf(
  parent: Object3D,
  position: readonly [number, number, number],
  rotation: number,
  material: Material,
): void {
  const mesh = new Mesh(new SphereGeometry(1, 10, 8), material);
  mesh.scale.set(0.035, 0.1, 0.012);
  mesh.position.set(...position);
  mesh.rotation.z = rotation;
  mesh.castShadow = true;
  parent.add(mesh);
}
