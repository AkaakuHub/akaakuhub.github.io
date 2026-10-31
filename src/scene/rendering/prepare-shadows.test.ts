import {
  BackSide,
  BoxGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  RenderTarget,
  Scene,
} from "three";
import type { Renderer } from "three/webgpu";
import { describe, expect, it, vi } from "vite-plus/test";
import { prepareShadows } from "./prepare-shadows";

function fixture() {
  const scene = new Scene();
  const light = new DirectionalLight();
  light.castShadow = true;
  light.shadow.map = new RenderTarget();
  const caster = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  caster.castShadow = true;
  const previous = new RenderTarget();
  const renderer = {
    getRenderTarget: () => previous,
    setRenderTarget: vi.fn<Renderer["setRenderTarget"]>(),
    compileAsync: vi.fn<Renderer["compileAsync"]>(async () => {}),
  };
  scene.add(light, caster);
  return { scene, light, caster, previous, renderer };
}

describe("影の非同期準備", () => {
  it("不透明な部材を影用の材質とカメラで準備し、元の設定を復元する", async () => {
    const f = fixture();
    const source = f.caster.material;
    f.renderer.compileAsync.mockImplementation(async (object, camera, scene) => {
      expect(object).toBe(f.caster);
      expect(camera).toBe(f.light.shadow.camera);
      expect(scene).toBe(f.scene);
      expect(f.scene.overrideMaterial?.name).toBe("ShadowMaterial");
      expect(f.scene.overrideMaterial?.side).toBe(BackSide);
      expect(f.caster.material).toBe(source);
    });
    await prepareShadows(f.renderer, f.scene);
    expect(f.renderer.compileAsync).toHaveBeenCalledOnce();
    expect(f.scene.overrideMaterial).toBeNull();
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);
  });

  it("切り抜きや透過面と影を落とさない部材には不透明な影の準備を適用しない", async () => {
    const f = fixture();
    f.caster.material.alphaTest = 0.5;
    const transparent = new Mesh(
      new BoxGeometry(),
      new MeshStandardMaterial({ transparent: true }),
    );
    transparent.castShadow = true;
    f.scene.add(transparent, new Mesh());
    await prepareShadows(f.renderer, f.scene);
    expect(f.renderer.compileAsync).not.toHaveBeenCalled();
  });

  it("準備の失敗時も材質と描画先を復元してエラーを通知する", async () => {
    const f = fixture();
    f.renderer.compileAsync.mockRejectedValue(new Error("device lost"));
    await expect(prepareShadows(f.renderer, f.scene)).rejects.toThrow("device lost");
    expect(f.scene.overrideMaterial).toBeNull();
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.previous);
  });
});
