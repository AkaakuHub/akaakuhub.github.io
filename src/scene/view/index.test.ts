import { Object3D, PerspectiveCamera } from "three";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createView } from "./index";

afterEach(() => vi.unstubAllGlobals());

function setup() {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  const target = {
    object: new Object3D(),
    width: 1,
    height: 1,
    depth: 0,
    offsetY: 0,
    topAligned: false,
  };
  const view = createView(
    camera,
    [target],
    target,
    () => {},
    () => {},
    () => ({ width: 800, height: 800, insetX: 12, insetY: 12 }),
  );
  return { camera, view };
}

describe("固定演出中の視点", () => {
  it("通常操作、端末の傾き、サイズ変更で演出中のカメラを上書きしない", () => {
    const { camera, view } = setup();
    view.select(3);
    view.lock();
    camera.position.set(2, 1.55, 0.95);
    const rotation = camera.quaternion.clone();
    view.select(0);
    view.inspect(0);
    view.inspectComputer();
    view.back();
    view.zoom(2, true);
    view.pan(1, 1);
    view.setMotion(1, 1);
    view.resize();
    expect(view.update(0.1)).toBe(false);
    expect(view.state).toEqual({ mode: "room", direction: 3 });
    expect(camera.position.toArray()).toEqual([2, 1.55, 0.95]);
    expect(camera.quaternion.equals(rotation)).toBe(true);
  });

  it("リスポーンで起動時の位置、向き、画角を復元して操作を再開する", () => {
    const { camera, view } = setup();
    const position = camera.position.clone();
    const rotation = camera.quaternion.clone();
    const fov = camera.fov;
    view.select(3);
    view.update(0.1);
    view.lock();
    camera.position.set(3, 1.55, 0.95);
    view.respawn();
    expect(view.locked).toBe(false);
    expect(view.state).toEqual({ mode: "notice", index: 0 });
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    expect(camera.fov).toBe(fov);
    view.select(1);
    expect(view.state).toEqual({ mode: "room", direction: 1 });
  });
});
