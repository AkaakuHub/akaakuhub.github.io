import { Mesh, MeshPhysicalMaterial } from "three";
import type { BufferGeometry, Material, Object3D, Scene } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export function batchStaticMeshes(scene: Scene, preserved: ReadonlySet<Object3D>): void {
  scene.updateMatrixWorld(true);
  const batches = new Map<string, Mesh<BufferGeometry, Material>[]>();
  scene.traverseVisible((object) => {
    if (
      !(object instanceof Mesh) ||
      Array.isArray(object.material) ||
      object.children.length > 0 ||
      preserved.has(object) ||
      object.name === "world-sky" ||
      object.name === "room-fluorescent" ||
      object.customDepthMaterial ||
      object.customDistanceMaterial ||
      object.onBeforeRender !== Mesh.prototype.onBeforeRender ||
      object.material.transparent ||
      (object.material instanceof MeshPhysicalMaterial && object.material.transmission > 0)
    )
      return;
    const key = [
      object.material.uuid,
      object.castShadow,
      object.receiveShadow,
      object.layers.mask,
      object.renderOrder,
      object.frustumCulled,
      ...Object.keys(object.geometry.attributes).sort(),
    ].join(":");
    const batch = batches.get(key);
    if (batch) batch.push(object);
    else batches.set(key, [object]);
  });
  for (const meshes of batches.values()) {
    const first = meshes[0];
    if (!first || meshes.length < 2) continue;
    const parts = meshes.map((mesh) => {
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      if (!geometry.index)
        geometry.setIndex(
          Array.from({ length: geometry.getAttribute("position").count }, (_, i) => i),
        );
      return geometry;
    });
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error("静止した部材の描画をまとめられませんでした。");
    const welded = mergeVertices(geometry);
    geometry.dispose();
    welded.computeBoundingBox();
    welded.computeBoundingSphere();
    const merged = new Mesh(welded, first.material);
    merged.name = `static-${first.material.uuid}`;
    merged.castShadow = first.castShadow;
    merged.receiveShadow = first.receiveShadow;
    merged.layers.mask = first.layers.mask;
    merged.renderOrder = first.renderOrder;
    merged.frustumCulled = first.frustumCulled;
    scene.add(merged);
    for (const mesh of meshes) mesh.removeFromParent();
  }
  scene.traverse((object) => {
    if (!preserved.has(object)) object.matrixAutoUpdate = false;
  });
  scene.updateMatrixWorld(true);
}
