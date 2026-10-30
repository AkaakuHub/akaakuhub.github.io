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
  const staticSurfaces = new Group();
  scene.add(monitor, contributions, staticSurfaces);
  const pass = new DynamicSurfacePass(monitor, [], contributions, scene, camera, staticSurfaces);
  pass.setActive(true, true);
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
    staticSurfaces,
    pass,
    renderer,
    target: new RenderTarget(32, 32),
  };
}

describe("動く物体の描画", () => {
  it("電源を切ったPCとアニメーションが終了した掲示には追加描画を行わない", () => {
    const { pass, renderer, target } = fixture();
    expect(pass.setActive(false, false)).toBe(true);
    expect(pass.visible).toBe(false);
    pass.render(renderer, target);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(pass.setActive(false, false)).toBe(false);
    pass.setActive(true, false);
    pass.render(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it("草だけが動く間は停止したPCを追加描画から外す", () => {
    const { pass, monitor, contributions, camera, renderer, target } = fixture();
    contributions.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    pass.setActive(false, true);
    renderer.render.mockImplementation(() => {
      expect(monitor.visible).toBe(false);
      expect(camera.layers.test(contributions.children[0]!.layers)).toBe(true);
    });
    pass.render(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(monitor.visible).toBe(true);
  });

  it("停止中のPCも透過面より後に描くキャッシュへ残す", () => {
    const { pass, monitor, contributions, renderer, target } = fixture();
    contributions.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    pass.setActive(false, true);
    renderer.render.mockImplementation(() => {
      expect(monitor.visible).toBe(true);
      expect(contributions.visible).toBe(false);
    });
    pass.renderStatic(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(contributions.visible).toBe(true);
  });

  it("画面外なら追加の描画を行わない", () => {
    const { scene, monitor, pass, renderer, target } = fixture();
    monitor.position.x = 100;
    scene.updateMatrixWorld(true);
    pass.render(renderer, target);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(renderer.setRenderTarget).not.toHaveBeenCalled();
  });

  it("画面内の物体を描画し、描画状態を復元する", () => {
    const { scene, camera, pass, renderer, target, staticSurfaces } = fixture();
    renderer.render.mockImplementation(() => expect(staticSurfaces.visible).toBe(false));
    scene.updateMatrixWorld(true);
    const layers = camera.layers.mask;
    pass.render(renderer, target);
    expect(renderer.render).toHaveBeenCalledOnce();
    expect(camera.layers.mask).toBe(layers);
    expect(renderer.autoClear).toBe(true);
    expect(staticSurfaces.visible).toBe(true);
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
