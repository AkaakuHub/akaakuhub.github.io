import {
  BoxGeometry,
  Frustum,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
} from "three";
import { describe, expect, it } from "vite-plus/test";

function cameraFrustum() {
  const camera = new PerspectiveCamera(45, 1, 0.05, 40);
  camera.updateMatrixWorld();
  return new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
}

describe("静止した部材の視野判定", () => {
  it("包囲球だけが視野に入る横長の部材を描かない", () => {
    const frustum = cameraFrustum();
    const floor = new Mesh(new BoxGeometry(20, 0.1, 2), new MeshBasicMaterial());
    floor.position.set(0, -1, -1.2);
    floor.updateMatrixWorld();
    expect(frustum.intersectsObject(floor)).toBe(true);
    floor.matrixAutoUpdate = false;
    expect(frustum.intersectsObject(floor)).toBe(false);
  });

  it("端だけが視野へ入る部材は残す", () => {
    const frustum = cameraFrustum();
    const floor = new Mesh(new BoxGeometry(20, 0.1, 2), new MeshBasicMaterial());
    floor.position.set(0, -1, -1.3);
    floor.updateMatrixWorld();
    floor.matrixAutoUpdate = false;
    expect(frustum.intersectsObject(floor)).toBe(true);
  });

  it("インスタンスの位置とオブジェクトの変換を含めて判定する", () => {
    const frustum = cameraFrustum();
    const mesh = new InstancedMesh(new BoxGeometry(0.2, 0.2, 0.2), new MeshBasicMaterial(), 2);
    mesh.setMatrixAt(0, new Matrix4().makeTranslation(20, 0, -3));
    mesh.setMatrixAt(1, new Matrix4().makeTranslation(0, 0, -3));
    mesh.updateMatrixWorld();
    mesh.matrixAutoUpdate = false;
    expect(frustum.intersectsObject(mesh)).toBe(true);
    mesh.position.x = 30;
    mesh.updateMatrix();
    mesh.updateMatrixWorld();
    expect(frustum.intersectsObject(mesh)).toBe(false);
  });
});
