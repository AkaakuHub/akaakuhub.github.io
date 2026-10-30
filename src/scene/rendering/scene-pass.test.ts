import { Group, PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";
import { describe, expect, it, vi } from "vite-plus/test";
import { ScenePass } from "./scene-pass";

function fixture() {
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  const animated = new Group();
  scene.add(animated);
  const renderStatic = vi.fn<ConstructorParameters<typeof ScenePass>[3]>();
  const pass = new ScenePass(scene, camera, [animated], renderStatic);
  pass.setSize(320, 240);
  const renderer = {
    autoClear: false,
    render: vi.fn<Renderer["render"]>(),
    setRenderTarget: vi.fn<Renderer["setRenderTarget"]>(),
  };
  return {
    scene,
    camera,
    animated,
    pass,
    renderer,
    renderStatic,
    output: new RenderTarget(320, 240),
  };
}

describe("静止した部屋の描画", () => {
  it("停止した物体の追加描画もキャッシュし、移動中には重ねて描かない", () => {
    const { pass, animated, renderStatic, renderer, output } = fixture();
    renderStatic.mockImplementation(() => expect(animated.visible).toBe(true));
    pass.render(renderer, output, true, false);
    expect(renderStatic).not.toHaveBeenCalled();
    const cached = pass.render(renderer, output, false, false);
    expect(renderStatic).toHaveBeenCalledExactlyOnceWith(renderer, cached);
    pass.render(renderer, output, false, true);
    expect(renderStatic).toHaveBeenCalledOnce();
    pass.invalidate();
    pass.render(renderer, output, false, false);
    expect(renderStatic).toHaveBeenCalledTimes(2);
  });
  it("移動中は動く物体も同じ描画に含め、停止後は静的なキャッシュから外す", () => {
    const { scene, pass, animated, renderer, output } = fixture();
    const visibility: boolean[] = [];
    renderer.render.mockImplementation((object) => {
      if (object === scene) visibility.push(animated.visible);
    });
    pass.render(renderer, output, true, false);
    pass.render(renderer, output, false, false);
    pass.render(renderer, output, false, false);
    expect(visibility).toEqual([true, false]);
    expect(animated.visible).toBe(true);
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });
  it("動的な合成がなければキャッシュの色と深度を直接再利用する", () => {
    const { pass, renderer, output } = fixture();
    const first = pass.render(renderer, output, false, false);
    expect(first).not.toBe(output);
    expect(first.depthTexture).not.toBeNull();
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(pass.render(renderer, output, false, false)).toBe(first);
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(renderer.autoClear).toBe(false);
  });

  it("動的な合成が必要なときだけ色と深度を作業用バッファーへ複写する", () => {
    const { pass, renderer, output } = fixture();
    expect(pass.render(renderer, output, false, true)).toBe(output);
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(pass.render(renderer, output, false, true)).toBe(output);
    expect(renderer.render).toHaveBeenCalledTimes(3);
  });

  it("移動中に動的な合成があれば作業用バッファーへ直接描き、停止後はキャッシュを作り直す", () => {
    const { pass, renderer, output } = fixture();
    expect(pass.render(renderer, output, true, true)).toBe(output);
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(output);
    expect(renderer.render).toHaveBeenCalledOnce();
    const cached = pass.render(renderer, output, false, false);
    expect(cached).not.toBe(output);
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(pass.render(renderer, output, false, false)).toBe(cached);
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("カメラと部屋が変わったときだけ静的な描画を更新する", () => {
    const { pass, camera, renderer, output } = fixture();
    pass.render(renderer, output, false, false);
    camera.position.x = 0.1;
    pass.render(renderer, output, false, false);
    pass.render(renderer, output, false, false);
    expect(renderer.render).toHaveBeenCalledTimes(2);
    pass.invalidate();
    pass.render(renderer, output, false, false);
    expect(renderer.render).toHaveBeenCalledTimes(3);
  });

  it("描画に失敗しても動的物体の可視性とクリア設定を復元する", () => {
    const { pass, animated, renderer, output } = fixture();
    renderer.render.mockImplementationOnce(() => {
      expect(animated.visible).toBe(false);
      throw new Error("GPU error");
    });
    expect(() => pass.render(renderer, output, false, false)).toThrow("GPU error");
    expect(animated.visible).toBe(true);
    expect(renderer.autoClear).toBe(false);
  });
});
