import { Group, InstancedMesh, Mesh, MeshPhysicalMaterial, Vector3 } from "three";
import type { BufferGeometry, Material, Object3D, Scene } from "three";
import { decodeGeometry, encodeGeometry, geometryTransfers } from "./geometry/batching/protocol";
import type { BatchRequest, BatchResponse, GeometryData } from "./geometry/batching/protocol";

export function createStaticBatcher() {
  const worker = new Worker(new URL("./geometry/batching/prepare.worker.ts", import.meta.url), {
    type: "module",
  });
  let failure: Error | undefined;
  worker.addEventListener("error", (event) => {
    failure = new Error(event.message);
  });
  return async (scene: Scene, preserved: ReadonlySet<Object3D>): Promise<void> => {
    try {
      scene.updateMatrixWorld(true);
      const batches = new Map<string, Mesh<BufferGeometry, Material>[]>();
      const center = new Vector3();
      scene.traverseVisible((object) => {
        if (
          !(object instanceof Mesh) ||
          object instanceof InstancedMesh ||
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
      const tasks = [...batches.values()].filter(
        (meshes) => meshes.length > 1 || meshes[0]?.geometry.userData.metricUv === true,
      );
      const geometries: GeometryData[] = [];
      const ids = new Map<BufferGeometry, number>();
      const request: BatchRequest = {
        geometries,
        batches: tasks.map((meshes) =>
          meshes.map((mesh) => {
            let id = ids.get(mesh.geometry);
            if (id === undefined) {
              id = geometries.length;
              ids.set(mesh.geometry, id);
              geometries.push(encodeGeometry(mesh.geometry, true));
            }
            return { geometry: id, matrix: [...mesh.matrixWorld.elements] };
          }),
        ),
      };
      if (failure) throw failure;
      const prepared = await new Promise<GeometryData[]>((resolve, reject) => {
        worker.onmessage = (event: MessageEvent<BatchResponse>) => {
          if (event.data.ok) resolve(event.data.geometries);
          else reject(new Error(event.data.message));
        };
        worker.onerror = (event) => reject(new Error(event.message));
        worker.onmessageerror = () =>
          reject(new Error("部材の結合結果をWorkerから受け取れませんでした。"));
        worker.postMessage(request, geometryTransfers(geometries));
      });
      for (const [index, meshes] of tasks.entries()) {
        const first = meshes[0];
        const result = prepared[index];
        if (!first || !result) throw new Error("結合した部材が見つかりません。");
        const geometry = decodeGeometry(result);
        if (meshes.length === 1) {
          first.geometry = geometry;
          continue;
        }
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
      const groups: Group[] = [];
      scene.traverse((object) => {
        if (object instanceof Group) groups.push(object);
        if (!preserved.has(object)) object.matrixAutoUpdate = false;
      });
      for (const group of groups.reverse())
        if (group.children.length === 0 && !preserved.has(group)) group.removeFromParent();
      scene.updateMatrixWorld(true);
    } finally {
      worker.terminate();
    }
  };
}
