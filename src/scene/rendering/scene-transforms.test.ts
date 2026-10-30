import { Group, Object3D, Scene, Vector3 } from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { SceneTransforms } from "./scene-transforms";

function fixture() {
  const scene = new Scene();
  scene.matrixAutoUpdate = false;
  const furniture = new Group();
  furniture.position.x = 2;
  furniture.updateMatrix();
  furniture.matrixAutoUpdate = false;
  const fixed = new Object3D();
  fixed.matrixAutoUpdate = false;
  const animated = new Group();
  const child = new Object3D();
  child.position.y = 1;
  animated.add(child);
  furniture.add(fixed, animated);
  scene.add(furniture);
  const transforms = new SceneTransforms(scene);
  transforms.update();
  return { scene, furniture, fixed, animated, child, transforms };
}

describe("部屋の座標更新", () => {
  it("静止した家具を再走査せず可動部とその子の座標を更新する", () => {
    const { furniture, fixed, animated, child, transforms } = fixture();
    const staticUpdate = vi.spyOn(fixed, "updateWorldMatrix");
    const traversal = vi.spyOn(furniture, "updateMatrixWorld");
    animated.position.x = 3;
    child.position.y = 4;
    transforms.update();
    expect(new Vector3().setFromMatrixPosition(child.matrixWorld).toArray()).toEqual([5, 4, 0]);
    expect(staticUpdate).not.toHaveBeenCalled();
    expect(traversal).not.toHaveBeenCalled();
  });

  it("部屋の変更通知で固定物と新しく追加された可動部を更新する", () => {
    const { furniture, transforms } = fixture();
    furniture.position.x = 5;
    furniture.updateMatrix();
    const added = new Object3D();
    furniture.add(added);
    transforms.invalidate();
    transforms.update();
    added.position.z = 3;
    transforms.update();
    expect(new Vector3().setFromMatrixPosition(added.matrixWorld).toArray()).toEqual([5, 0, 3]);
  });

  it("描画パスによる部屋全体の自動更新を止める", () => {
    const { scene, transforms } = fixture();
    expect(scene.matrixWorldAutoUpdate).toBe(false);
    transforms.invalidate();
    transforms.update();
    expect(scene.matrixWorldAutoUpdate).toBe(false);
  });

  it("座標更新に失敗しても全体の自動更新を再開しない", () => {
    const { scene, furniture, transforms } = fixture();
    transforms.invalidate();
    vi.spyOn(furniture, "updateMatrixWorld").mockImplementationOnce(() => {
      throw new Error("transform error");
    });
    expect(() => transforms.update()).toThrow("transform error");
    expect(scene.matrixWorldAutoUpdate).toBe(false);
  });
});
