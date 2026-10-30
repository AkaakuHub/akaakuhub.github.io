import { Group, PerspectiveCamera, RenderTarget } from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { SkyPass } from "./sky-pass";

describe("部屋と分離した空の描画", () => {
  it("同じ視点で判定を繰り返した後も、投影範囲と親の移動を反映する", () => {
    const camera = new PerspectiveCamera(62, 4 / 3, 0.05, 40);
    camera.position.set(0, 1.55, 0.45);
    camera.lookAt(-5, 1.7, 0);
    const parent = new Group();
    parent.add(camera);
    parent.updateMatrixWorld(true);
    const pass = new SkyPass(new Group(), camera);
    expect(pass.visible).toBe(true);
    expect(pass.visible).toBe(true);
    camera.far = 1;
    camera.updateProjectionMatrix();
    expect(pass.visible).toBe(false);
    camera.far = 40;
    camera.updateProjectionMatrix();
    expect(pass.visible).toBe(true);
    parent.position.x = -10;
    parent.updateMatrixWorld(true);
    expect(pass.visible).toBe(false);
  });

  it("窓を見るときだけ空を表示対象にする", () => {
    const camera = new PerspectiveCamera(62, 4 / 3, 0.05, 40);
    camera.position.set(0, 1.55, 0.45);
    const pass = new SkyPass(new Group(), camera);
    camera.lookAt(-5, 1.7, 0);
    expect(pass.visible).toBe(true);
    camera.lookAt(0, 1.7, -5);
    expect(pass.visible).toBe(false);
  });

  it("部屋の色と深度を消さず同じカメラで空だけを重ねる", () => {
    const camera = new PerspectiveCamera();
    const sky = new Group();
    const pass = new SkyPass(sky, camera);
    const target = new RenderTarget(320, 240);
    const renderer = {
      autoClear: true,
      setRenderTarget: vi.fn(),
      render: vi.fn(() => expect(renderer.autoClear).toBe(false)),
    };
    pass.render(renderer, target);
    expect(renderer.setRenderTarget).toHaveBeenCalledWith(target);
    expect(renderer.render).toHaveBeenCalledWith(sky.parent, camera);
    expect(renderer.autoClear).toBe(true);
  });
});
