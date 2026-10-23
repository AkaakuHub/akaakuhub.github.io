import { BoxGeometry, Mesh, MeshStandardMaterial } from "three";
import type { Material, Object3D } from "three";

export function box(
  parent: Object3D,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  material: Material,
): Mesh<BoxGeometry, Material> {
  const mesh = new Mesh(new BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function surface(color: string, roughness = 0.8, metalness = 0): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness });
}
