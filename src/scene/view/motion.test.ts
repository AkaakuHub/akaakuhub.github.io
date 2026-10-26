import { Object3D, PerspectiveCamera } from "three";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createView } from "./index";
import { roomPose } from "./targets";

function createFixture() {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  const target = {
    object: new Object3D(),
    width: 1.08,
    height: 0.91,
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
    () => ({
      width: 390,
      height: 844,
      insetX: 12,
      insetY: 12,
    }),
  );
  return { camera, view };
}

function settle(view: ReturnType<typeof createView>): void {
  for (let frame = 0; frame < 240; frame++) view.update(1 / 60);
}

afterEach(() => vi.unstubAllGlobals());

describe("モーションによる視点の移動", () => {
  it("同じ傾きを保持しても移動が積み重ならない", () => {
    const { camera, view } = createFixture();
    const initial = camera.position.clone();
    view.setMotion(1, 1);
    settle(view);
    const position = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    settle(view);
    expect(camera.position.distanceTo(position)).toBeLessThan(0.000001);
    expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(0.000001);
    expect(camera.position.distanceTo(initial)).toBeCloseTo(0.025);
  });

  it("オフにすると小さな傾きも残さず元の視点へ戻る", () => {
    const { camera, view } = createFixture();
    const position = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    view.setMotion(0.01, 0);
    settle(view);
    view.setMotion(0.004, 0);
    settle(view);
    view.setMotion(0, 0);
    settle(view);
    expect(camera.position.distanceTo(position)).toBeLessThan(0.000001);
    expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(0.000001);
    expect(view.update(1 / 60)).toBe(false);
  });

  it("端末を傾けたまま方向を切り替えても通常の視点を保つ", () => {
    const { camera, view } = createFixture();
    view.setMotion(1, -1);
    settle(view);
    view.select(1);
    settle(view);
    view.setMotion(0, 0);
    settle(view);
    const expected = roomPose(1, 1, camera.aspect);
    expect(camera.position.distanceTo(expected.position)).toBeLessThan(0.000001);
    expect(camera.quaternion.angleTo(expected.quaternion)).toBeLessThan(0.000001);
  });

  it("大きな入力でも移動と回転を小さな範囲に収める", () => {
    const { camera, view } = createFixture();
    const initial = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    view.setMotion(100, -100);
    settle(view);
    expect(camera.position.distanceTo(initial)).toBeCloseTo(0.025);
    expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(0.11);
  });
});
