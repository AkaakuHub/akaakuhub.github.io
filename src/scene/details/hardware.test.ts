import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from "three";
import { describe, expect, it } from "vite-plus/test";
import { HardwareBatch } from "./hardware";

describe("同じ金具の形状の共有", () => {
  it("ビス32本の形状・法線・UVを1本と同じデータで描画する", () => {
    const material = new MeshStandardMaterial();
    const single = new Group();
    const one = new HardwareBatch();
    one.screw(material, [0, 0, 0]);
    one.finish(single);
    const original = single.children[0];
    if (!(original instanceof Mesh)) throw new Error("比較元のビスがありません。");
    const parent = new Group();
    const batch = new HardwareBatch();
    for (let index = 0; index < 32; index++) batch.screw(material, [index * 0.02, 0, 0]);
    batch.finish(parent);
    expect(parent.children).toHaveLength(1);
    const mesh = parent.children[0];
    if (!(mesh instanceof InstancedMesh)) throw new Error("ビスの形状が共有されていません。");
    expect(mesh.count).toBe(32);
    expect(mesh.material).toBe(material);
    for (const name of ["position", "normal", "uv"])
      expect([...mesh.geometry.getAttribute(name).array]).toEqual([
        ...original.geometry.getAttribute(name).array,
      ]);
    expect([...mesh.geometry.index!.array]).toEqual([...original.geometry.index!.array]);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it("配置・回転を反映した範囲と当たり判定を保つ", () => {
    const material = new MeshStandardMaterial();
    const geometry = new BoxGeometry(2, 1, 1);
    const parent = new Group();
    const batch = new HardwareBatch();
    batch.add(geometry, material, [0, 1, 0]);
    batch.add(geometry, material, [4, 0, 0], [0, 0, Math.PI / 2]);
    batch.finish(parent);
    parent.updateMatrixWorld(true);
    const mesh = parent.children[0];
    if (!(mesh instanceof InstancedMesh)) throw new Error("配置された金具がありません。");
    expect(mesh.boundingBox?.min.toArray()).toEqual([-1, -1, -0.5]);
    expect(mesh.boundingBox?.max.toArray()).toEqual([4.5, 1.5, 0.5]);
    const world = new Matrix4();
    mesh.getMatrixAt(1, world);
    expect(new Vector3(1, 0, 0).applyMatrix4(world).toArray()).toEqual([4, 1, 0]);
    const ray = new Raycaster(new Vector3(4, 0, 5), new Vector3(0, 0, -1));
    const hit = ray.intersectObject(mesh)[0];
    expect(hit?.instanceId).toBe(1);
    expect(hit?.distance).toBeCloseTo(4.5);
  });

  it("材質が異なる金具を分け、1個ずつ異なる部材はまとめる", () => {
    const steel = new MeshStandardMaterial();
    const brass = new MeshStandardMaterial();
    const parent = new Group();
    const batch = new HardwareBatch();
    const first = new BoxGeometry(1, 1, 1);
    batch.add(first, steel, [0, 0, 0]);
    batch.add(new BoxGeometry(2, 1, 1), steel, [2, 0, 0]);
    batch.add(first, brass, [0, 1, 0]);
    batch.add(first, brass, [0, 2, 0]);
    batch.finish(parent);
    expect(parent.children).toHaveLength(2);
    expect(parent.children.filter((object) => object instanceof InstancedMesh)).toHaveLength(1);
    expect(parent.children.find((object) => object instanceof InstancedMesh)?.material).toBe(brass);
    const next = new Group();
    batch.finish(next);
    expect(next.children).toHaveLength(0);
  });
});
