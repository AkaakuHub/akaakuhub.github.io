import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RenderTarget,
  Scene,
} from "three";
import type { Renderer } from "three/webgpu";
import { describe, expect, it, vi } from "vite-plus/test";
import { DynamicSurfacePass } from "./dynamic-pass";

function fixture() {
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.position.z = 3;
  const monitor = new Mesh(new BoxGeometry(1, 1, 0.1), new MeshBasicMaterial());
  const contributions = new Group();
  scene.add(monitor, contributions);
  const pass = new DynamicSurfacePass(monitor, [], contributions, scene, camera);
  const renderer = {
    autoClear: true,
    setRenderTarget: vi.fn<Renderer["setRenderTarget"]>(),
    render: vi.fn<Renderer["render"]>(),
  };
  return {
    scene,
    camera,
    monitor,
    contributions,
    pass,
    renderer,
    target: new RenderTarget(32, 32),
  };
}

describe("動く物体の描画", () => {
  it("画面外なら追加の描画を行わない", () => {
    const { scene, monitor, pass, renderer, target } = fixture();
    monitor.position.x = 100;
    scene.updateMatrixWorld(true);
    pass.render(renderer, target);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(renderer.setRenderTarget).not.toHaveBeenCalled();
  });

  it("画面内の物体を描画し、描画状態を復元する", () => {
    const { scene, camera, pass, renderer, target } = fixture();
    scene.updateMatrixWorld(true);
    const layers = camera.layers.mask;
    pass.render(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(camera.layers.mask).toBe(layers);
    expect(renderer.autoClear).toBe(true);
  });

  it("親が非表示の物体を描画しない", () => {
    const { scene, monitor, pass, renderer, target } = fixture();
    const parent = new Group();
    parent.visible = false;
    parent.add(monitor);
    scene.add(parent);
    scene.updateMatrixWorld(true);
    pass.render(renderer, target);
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it("後から読み込まれた草も画面内にあれば描画する", () => {
    const { scene, monitor, contributions, pass, renderer, target } = fixture();
    monitor.position.x = 100;
    contributions.add(new Mesh(new BoxGeometry(1, 1, 0.01), new MeshBasicMaterial()));
    scene.updateMatrixWorld(true);
    pass.render(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it("親の向きや位置が変わったときは描画前の可視判定へ反映する", () => {
    const { scene, monitor, pass } = fixture();
    const parent = new Group();
    parent.add(monitor);
    scene.add(parent);
    expect(pass.visible).toBe(true);
    parent.position.x = 100;
    expect(pass.visible).toBe(false);
    parent.position.x = 0;
    expect(pass.visible).toBe(true);
  });
});
