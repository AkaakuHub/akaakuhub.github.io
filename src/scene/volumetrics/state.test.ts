import { DepthTexture, DirectionalLight, PerspectiveCamera, RenderTarget } from "three";
import { describe, expect, it } from "vite-plus/test";
import { ScatteringState } from "./state";

function fixture() {
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.position.set(0, 1.55, 0.45);
  camera.updateMatrixWorld();
  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(-4, 8, 2);
  light.updateMatrixWorld();
  const state = new ScatteringState();
  expect(state.update(camera, light)).toBe(true);
  return { camera, light, state };
}

describe("散乱光の再計算", () => {
  it("視点と天体光が同じなら計算結果を再利用する", () => {
    const { camera, light, state } = fixture();
    for (let frame = 0; frame < 100; frame++) expect(state.update(camera, light)).toBe(false);
  });

  it("視点の移動と投影の変更を反映する", () => {
    const { camera, light, state } = fixture();
    camera.position.x += 0.01;
    camera.updateMatrixWorld();
    expect(state.update(camera, light)).toBe(true);
    camera.aspect = 0.5;
    camera.updateProjectionMatrix();
    expect(state.update(camera, light)).toBe(true);
    expect(state.update(camera, light)).toBe(false);
  });

  it("天体光の色・強さ・方向の変更を反映する", () => {
    const { camera, light, state } = fixture();
    light.intensity = 0.3;
    expect(state.update(camera, light)).toBe(true);
    light.color.set("#a4c4ff");
    expect(state.update(camera, light)).toBe(true);
    light.target.position.x = 1;
    expect(state.update(camera, light)).toBe(true);
  });

  it("影の行列・バイアス・深度テクスチャの変更を反映する", () => {
    const { camera, light, state } = fixture();
    light.shadow.matrix.elements[12] = 0.25;
    expect(state.update(camera, light)).toBe(true);
    light.shadow.bias = -0.0002;
    expect(state.update(camera, light)).toBe(true);
    light.shadow.map = new RenderTarget(32, 32, { depthTexture: new DepthTexture(32, 32) });
    expect(state.update(camera, light)).toBe(true);
    expect(state.update(camera, light)).toBe(false);
    light.shadow.map.dispose();
  });

  it("画面サイズ変更や影の描き直しを明示的に反映する", () => {
    const { camera, light, state } = fixture();
    state.invalidate();
    expect(state.update(camera, light)).toBe(true);
    expect(state.update(camera, light)).toBe(false);
  });
});
