import {
  Box3,
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from "three";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createStaticBatcher } from "../../static-batches";
import { metricBoxUv } from "../../materials/uv";
import { mergeBatches } from "./merge";
import type { BatchRequest, BatchResponse } from "./protocol";

class GeometryWorker {
  onmessage: ((event: MessageEvent<BatchResponse>) => void) | null = null;
  addEventListener(): void {}
  terminate(): void {}
  postMessage(request: BatchRequest): void {
    queueMicrotask(() =>
      this.onmessage?.(
        new MessageEvent<BatchResponse>("message", {
          data: { ok: true, geometries: mergeBatches(request) },
        }),
      ),
    );
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("静止した部材の結合", () => {
  it("近くの同じ材質の部材をまとめ、可動部の位置と独立した操作を保つ", async () => {
    vi.stubGlobal("Worker", GeometryWorker);
    const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    const material = new MeshStandardMaterial();
    const scene = new Scene();
    const first = new Mesh(geometry, material);
    first.position.set(0.5, 0.5, 0.5);
    const second = new Mesh(geometry, material);
    second.position.set(2.5, 0.5, 0.5);
    const moving = new Mesh(geometry, material);
    moving.position.set(1.5, 0.5, 0.5);
    scene.add(first, second, moving);
    const bounds = new Box3().setFromObject(scene);
    await createStaticBatcher()(scene, new Set([moving]));
    expect(scene.children).toHaveLength(2);
    expect(new Box3().setFromObject(scene).equals(bounds)).toBe(true);
    expect(moving.parent).toBe(scene);
    expect(moving.matrixAutoUpdate).toBe(true);
    moving.position.z += 1;
    scene.updateMatrixWorld();
    expect(moving.matrixWorld.elements[14]).toBe(1.5);
  });

  it("共有した金具を再結合して配置を失わない", async () => {
    vi.stubGlobal("Worker", GeometryWorker);
    const geometry = new BoxGeometry(1, 1, 1);
    metricBoxUv(geometry);
    const material = new MeshStandardMaterial();
    const instances = new InstancedMesh(geometry, material, 2);
    instances.setMatrixAt(0, new Matrix4().makeTranslation(-2, 0, 0));
    instances.setMatrixAt(1, new Matrix4().makeTranslation(2, 0, 0));
    instances.computeBoundingBox();
    instances.computeBoundingSphere();
    const placements = [...instances.instanceMatrix.array];
    const scene = new Scene();
    scene.add(instances, new Mesh(geometry, material));
    await createStaticBatcher()(scene, new Set());
    expect(scene.children).toHaveLength(2);
    expect(scene.children).toContain(instances);
    expect(instances.geometry).toBe(geometry);
    expect(instances.count).toBe(2);
    expect([...instances.instanceMatrix.array]).toEqual(placements);
    expect(instances.boundingBox?.min.x).toBe(-2.5);
    expect(instances.boundingBox?.max.x).toBe(2.5);
  });
});
