import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createView } from "./index";
import { NoticeTour } from "./notice-tour";
import { roomPose } from "./targets";

function createFixture(reducedMotion = false) {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: reducedMotion }) });
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
    { ...target, screen: target },
    target,
    () => {},
    () => {},
    () => ({
      width: 390,
      height: 844,
      insetX: 12,
      insetY: 12,
    }),
    new NoticeTour({ getItem: () => "true", setItem: () => {} }, 0),
  );
  return { camera, view };
}

function settle(view: ReturnType<typeof createView>): void {
  for (let frame = 0; frame < 240; frame++) view.update(1 / 60);
}

afterEach(() => vi.unstubAllGlobals());

describe("モーションによる視点の移動", () => {
  it("傾きに対する視点の移動と回転を反対向きに補正する", () => {
    const { camera, view } = createFixture();
    const initial = camera.position.clone();
    view.setMotion(1, 1);
    settle(view);
    expect(camera.position.x).toBeLessThan(initial.x);
    expect(camera.position.y).toBeGreaterThan(initial.y);
    const direction = camera.getWorldDirection(new Vector3());
    expect(direction.x).toBeLessThan(0);
    expect(direction.y).toBeGreaterThan(0);
  });

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

describe("視点を切り替えるアニメーション", () => {
  it("フォーカス解除では通常画質を保ち部屋の回転中だけ解像度を下げる", () => {
    const { view } = createFixture();
    view.back();
    expect(view.moving).toBe(true);
    expect(view.rotating).toBe(false);
    settle(view);
    view.select(1);
    expect(view.rotating).toBe(true);
    view.lock();
    expect(view.rotating).toBe(false);
    view.unlock();
    settle(view);
    expect(view.rotating).toBe(false);
    view.inspectComputer();
    expect(view.moving).toBe(true);
    expect(view.rotating).toBe(false);
    settle(view);
    view.back();
    expect(view.rotating).toBe(false);
  });

  it("動きを減らす設定では向きを切り替えても解像度を下げない", () => {
    const { view } = createFixture(true);
    view.back();
    settle(view);
    view.select(1);
    expect(view.rotating).toBe(false);
  });

  it("20fpsでも60fpsと同じ時間で視点が進む", () => {
    const smooth = createFixture();
    const slow = createFixture();
    smooth.view.back();
    slow.view.back();
    for (let frame = 0; frame < 12; frame++) smooth.view.update(1 / 60);
    for (let frame = 0; frame < 4; frame++) slow.view.update(1 / 20);
    expect(smooth.camera.position.distanceTo(slow.camera.position)).toBeLessThan(0.000001);
    expect(smooth.camera.quaternion.angleTo(slow.camera.quaternion)).toBeLessThan(0.000001);
    for (let frame = 0; frame < 3; frame++) slow.view.update(1 / 20);
    expect(slow.view.moving).toBe(false);
  });

  it("描画が遅れても一度の更新で移動先へ飛ばない", () => {
    const { camera, view } = createFixture();
    const initial = camera.position.clone();
    const destination = roomPose(0, 0, camera.aspect);
    view.back();
    expect(view.update(0.8)).toBe(true);
    expect(camera.position.distanceTo(initial)).toBeGreaterThan(0);
    expect(camera.position.distanceTo(destination.position)).toBeGreaterThan(0.01);
    settle(view);
    expect(camera.position.distanceTo(destination.position)).toBeLessThan(0.000001);
  });

  it("移動中に表示サイズが変わっても途中の視点を保つ", () => {
    const { camera, view } = createFixture();
    view.back();
    view.update(1 / 60);
    const position = camera.position.clone();
    const quaternion = camera.quaternion.clone();
    camera.aspect = 0.5;
    view.resize();
    expect(view.moving).toBe(true);
    expect(camera.position.distanceTo(position)).toBeLessThan(0.000001);
    expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(0.000001);
    settle(view);
    const destination = roomPose(0, 0, camera.aspect);
    expect(camera.position.distanceTo(destination.position)).toBeLessThan(0.000001);
    expect(camera.fov).toBeCloseTo(destination.fov);
  });

  it("動きを減らす設定ではアニメーションせず移動する", () => {
    const { camera, view } = createFixture(true);
    view.back();
    expect(view.update(1 / 60)).toBe(false);
    const destination = roomPose(0, 0, camera.aspect);
    expect(camera.position.distanceTo(destination.position)).toBeLessThan(0.000001);
    expect(camera.quaternion.angleTo(destination.quaternion)).toBeLessThan(0.000001);
  });
});
