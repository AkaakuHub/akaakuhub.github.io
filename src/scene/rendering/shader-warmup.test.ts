import { BoxGeometry, Mesh, PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";
import { describe, expect, it, vi } from "vite-plus/test";
import { ShaderWarmup } from "./shader-warmup";

function fixture() {
  const scene = new Scene();
  const object = new Mesh();
  object.position.z = 10;
  scene.add(object);
  const compilation = Promise.withResolvers<void>();
  const previous = new RenderTarget();
  const target = new RenderTarget();
  const camera = new PerspectiveCamera();
  const renderer = {
    getRenderTarget: () => previous,
    setRenderTarget: vi.fn(),
    compileAsync: vi.fn<Renderer["compileAsync"]>(() => compilation.promise),
  };
  const warmup = new ShaderWarmup(renderer, scene, camera, target);
  return { object, compilation, previous, target, camera, scene, renderer, warmup };
}

describe("表示後のシェーダー準備", () => {
  it("初回表示で準備済みの視野内の部材と常時描画する部材を再準備しない", async () => {
    const f = fixture();
    const scene = new Scene();
    const visible = new Mesh(new BoxGeometry());
    visible.position.z = -5;
    const uncullable = new Mesh(new BoxGeometry());
    uncullable.frustumCulled = false;
    scene.add(visible, uncullable);
    scene.updateMatrixWorld(true);
    const warmup = new ShaderWarmup(f.renderer, scene, f.camera, f.target);
    await warmup.prepareNext();
    expect(warmup.pending).toBe(false);
    expect(f.renderer.compileAsync).not.toHaveBeenCalled();
  });

  it("画面外も準備し、完了までは同時に次の準備を始めない", async () => {
    const f = fixture();
    const completion = f.warmup.prepareNext();
    expect(f.warmup.busy).toBe(true);
    expect(f.object.frustumCulled).toBe(false);
    expect(f.renderer.compileAsync).toHaveBeenCalledWith(f.object, f.camera, f.scene);
    await f.warmup.prepareNext();
    expect(f.renderer.compileAsync).toHaveBeenCalledOnce();
    f.compilation.resolve();
    await completion;
    expect(f.warmup.busy).toBe(false);
    expect(f.warmup.pending).toBe(false);
    expect(f.object.frustumCulled).toBe(true);
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);
  });

  it("コンパイル失敗時も描画先と可視判定の設定を復元する", async () => {
    const f = fixture();
    const completion = f.warmup.prepareNext();
    f.compilation.reject(new Error("device lost"));
    await expect(completion).rejects.toThrow("device lost");
    expect(f.warmup.busy).toBe(false);
    expect(f.object.frustumCulled).toBe(true);
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);
  });

  it("非表示のオブジェクトを準備対象にしない", async () => {
    const scene = new Scene();
    const object = new Mesh();
    object.visible = false;
    scene.add(object);
    const f = fixture();
    const warmup = new ShaderWarmup(f.renderer, scene, f.camera, f.target);
    await warmup.prepareNext();
    expect(warmup.pending).toBe(false);
    expect(f.renderer.compileAsync).not.toHaveBeenCalled();
  });
});
