import { Group, PerspectiveCamera, RenderTarget } from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { SkyPass } from "./sky-pass";

describe("部屋と分離した空の描画", () => {
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
