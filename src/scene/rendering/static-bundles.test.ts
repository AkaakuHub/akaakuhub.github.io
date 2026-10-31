import {
  BoxGeometry,
  Frustum,
  Group,
  Mesh,
  MeshBasicMaterial,
  Matrix4,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "three";
import { BundleGroup } from "three/webgpu";
import { describe, expect, it } from "vite-plus/test";
import { StaticSceneBundles } from "./static-bundles";

function fixture() {
  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.05, 40);
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  mesh.position.z = -3;
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  return { scene, camera, mesh };
}

describe("静止した部材の描画命令", () => {
  it("キャッシュした空間の範囲で、拡大・回転した部材も従来と同じ視野判定をする", () => {
    const { scene, camera, mesh } = fixture();
    mesh.rotation.set(0.2, 0.4, 0.1);
    mesh.scale.set(2, 0.5, 1.5);
    mesh.updateMatrix();
    const bundles = new StaticSceneBundles(scene);
    const group = mesh.parent;
    if (!(group instanceof BundleGroup)) throw new Error("描画命令のグループがありません。");
    let previous: boolean | undefined;
    for (const x of [0, 0.1, 7, 8, 0, -7]) {
      camera.position.x = x;
      camera.updateMatrixWorld();
      const expected = new Frustum()
        .setFromProjectionMatrix(
          new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
          camera.coordinateSystem,
        )
        .intersectsObject(mesh);
      const version = group.version;
      bundles.update(camera);
      expect(group.version > version).toBe(previous === undefined || expected !== previous);
      previous = expected;
    }
  });

  it("カメラが動いても映る部材が同じなら命令を再構築しない", () => {
    const { scene, camera, mesh } = fixture();
    const bundles = new StaticSceneBundles(scene);
    const group = mesh.parent;
    if (!(group instanceof BundleGroup)) throw new Error("描画命令のグループがありません。");
    bundles.update(camera);
    const version = group.version;
    camera.position.x = 0.05;
    bundles.update(camera);
    expect(group.version).toBe(version);
    camera.rotation.y = Math.PI;
    bundles.update(camera);
    expect(group.version).toBeGreaterThan(version);
    const behind = group.version;
    bundles.update(camera);
    expect(group.version).toBe(behind);
    bundles.invalidate();
    bundles.update(camera);
    expect(group.version).toBeGreaterThan(behind);
  });

  it("入れ子の部材の位置を保ち、可動部と透過面は通常の描画へ残す", () => {
    const { scene, mesh } = fixture();
    const parent = new Group();
    parent.position.set(2, 1, -1);
    parent.rotation.y = 0.4;
    parent.add(mesh);
    const animated = new Mesh(mesh.geometry, mesh.material);
    const transparent = new Mesh(mesh.geometry, new MeshBasicMaterial({ transparent: true }));
    transparent.matrixAutoUpdate = false;
    scene.add(parent, animated, transparent);
    scene.updateMatrixWorld(true);
    const position = mesh.getWorldPosition(new Vector3());
    const bundles = new StaticSceneBundles(scene);
    expect(mesh.getWorldPosition(new Vector3()).distanceTo(position)).toBeLessThan(1e-6);
    expect(mesh.parent).toBeInstanceOf(BundleGroup);
    expect(animated.parent).toBe(scene);
    expect(transparent.parent).toBe(scene);
    expect(bundles.root.matrixAutoUpdate).toBe(false);
  });
});
