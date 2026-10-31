import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RenderTarget,
  Scene,
} from "three";
import type { Renderer } from "three/webgpu";
import { describe, expect, it, vi } from "vite-plus/test";
import { prepareScene } from "./prepare-scene";

function fixture() {
  const scene = new Scene();
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  mesh.position.z = 10;
  scene.add(mesh);
  const previous = new RenderTarget();
  const renderer = {
    getRenderTarget: () => previous,
    setRenderTarget: vi.fn<Renderer["setRenderTarget"]>(),
    compileAsync: vi.fn<Renderer["compileAsync"]>(),
  };
  return {
    scene,
    mesh,
    previous,
    renderer,
    camera: new PerspectiveCamera(),
    target: new RenderTarget(),
  };
}

describe("操作前のシェーダー準備", () => {
  it("画面外も表示前に準備し、完了後は元の視野判定と描画先へ戻す", async () => {
    const { scene, mesh, previous, renderer, camera, target } = fixture();
    const progress = vi.fn<(value: number) => void>();
    renderer.compileAsync.mockImplementation(async (compiled, view, targetScene, report) => {
      expect(compiled).toBe(scene);
      expect(view).toBe(camera);
      expect(targetScene).toBeNull();
      expect(mesh.frustumCulled).toBe(false);
      report?.(
        Object.assign(new Event("progress"), { lengthComputable: true, loaded: 1, total: 2 }),
      );
    });
    await prepareScene(renderer, scene, camera, target, progress);
    expect(progress).toHaveBeenCalledWith(0.5);
    expect(mesh.frustumCulled).toBe(true);
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previous);
  });

  it("GPUの準備に失敗しても視野判定を保ち、失敗を呼び出し元へ伝える", async () => {
    const { scene, mesh, previous, renderer, camera, target } = fixture();
    mesh.frustumCulled = false;
    renderer.compileAsync.mockRejectedValue(new Error("GPU error"));
    await expect(prepareScene(renderer, scene, camera, target, () => {})).rejects.toThrow(
      "GPU error",
    );
    expect(mesh.frustumCulled).toBe(false);
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previous);
  });
});
