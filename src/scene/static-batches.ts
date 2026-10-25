import { Group, Mesh, MeshPhysicalMaterial, Vector3 } from "three";
import type { BufferGeometry, Material, Object3D, Scene } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { offsetSurfaceUv } from "./materials/surface-uv";

export function batchStaticMeshes(scene: Scene, preserved: ReadonlySet<Object3D>): void {
  scene.updateMatrixWorld(true);
  const batches = new Map<string, Mesh<BufferGeometry, Material>[]>();
  const center = new Vector3();
  const indexed = new Map<BufferGeometry, BufferGeometry>();
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
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox) throw new Error("部材の範囲を計算できません。");
    object.geometry.boundingBox.getCenter(center).applyMatrix4(object.matrixWorld);
    const key = [
      object.material.uuid,
      Math.floor(center.x / 1.5),
      Math.floor(center.y / 1.5),
      Math.floor(center.z / 1.5),
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
    if (!first) continue;
    if (meshes.length === 1) {
      if (first.geometry.userData.metricUv === true) {
        first.geometry = first.geometry.clone();
        offsetSurfaceUv(first.geometry, first.matrixWorld);
      }
      continue;
    }
    const parts = meshes.map((mesh) => {
      let source = mesh.geometry;
      if (!source.index) {
        const cached = indexed.get(source);
        if (cached) source = cached;
        else {
          const welded = mergeVertices(source);
          indexed.set(source, welded);
          source = welded;
        }
      }
      const part = source.clone();
      offsetSurfaceUv(part, mesh.matrixWorld);
      return part.applyMatrix4(mesh.matrixWorld);
    });
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error("静止した部材の描画をまとめられませんでした。");
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const merged = new Mesh(geometry, first.material);
    merged.name = `static-${first.material.uuid}`;
    merged.castShadow = first.castShadow;
    merged.receiveShadow = first.receiveShadow;
    merged.layers.mask = first.layers.mask;
    merged.renderOrder = first.renderOrder;
    merged.frustumCulled = first.frustumCulled;
    scene.add(merged);
    for (const mesh of meshes) mesh.removeFromParent();
  }
  for (const geometry of indexed.values()) geometry.dispose();
  const groups: Group[] = [];
  scene.traverse((object) => {
    if (object instanceof Group) groups.push(object);
    if (!preserved.has(object)) object.matrixAutoUpdate = false;
  });
  for (const group of groups.reverse())
    if (group.children.length === 0 && !preserved.has(group)) group.removeFromParent();
  scene.updateMatrixWorld(true);
}
