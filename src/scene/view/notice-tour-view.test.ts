import { Object3D, PerspectiveCamera } from "three";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createView } from "./index";
import { NoticeTour } from "./notice-tour";

afterEach(() => vi.unstubAllGlobals());

function setup(visited: boolean) {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
  const target = {
    object: new Object3D(),
    width: 1,
    height: 1,
    depth: 0,
    offsetY: 0,
    topAligned: false,
  };
  const view = createView(
    new PerspectiveCamera(62, 1, 0.05, 40),
    [target, target, target, target],
    { ...target, screen: target },
    target,
    () => {},
    () => {},
    () => ({ width: 800, height: 800, insetX: 12, insetY: 12 }),
    new NoticeTour({ getItem: () => (visited ? "true" : null), setItem: () => {} }, 3),
  );
  view.startIntroduction();
  return view;
}

describe("初回の視点移動", () => {
  it("末尾までは外への移動、紙の直接選択、ズームで経路を変えられない", () => {
    const view = setup(false);
    view.back();
    view.select(3);
    view.turn(1);
    view.inspect(3);
    view.inspectComputer();
    view.inspectScreen();
    view.inspectPrivacy();
    view.zoom(2, false);
    expect(view.state).toEqual({ mode: "notice", index: 0 });
    expect(view.zoomFactor).toBe(1);
    expect(view.showExitGuide).toBe(false);
  });

  it("順番に末尾へ進み、カメラ到着後にだけ退出と案内を解禁する", () => {
    const view = setup(false);
    for (const index of [1, 2]) {
      view.advanceNotice(1);
      view.update(1);
      expect(view.state).toEqual({ mode: "notice", index });
      expect(view.restricted).toBe(true);
    }
    view.advanceNotice(1);
    view.advanceNotice(1);
    view.back();
    expect(view.state).toEqual({ mode: "notice", index: 3 });
    expect(view.showExitGuide).toBe(false);
    view.update(1);
    expect(view.restricted).toBe(false);
    expect(view.showExitGuide).toBe(true);
    view.advanceNotice(1);
    expect(view.state).toEqual({ mode: "room", direction: 0 });
    expect(view.showExitGuide).toBe(false);
  });

  it("末尾からタップ相当の退出も許可し、再度紙を開いても案内を出さない", () => {
    const view = setup(false);
    for (let index = 0; index < 3; index++) {
      view.advanceNotice(1);
      view.update(1);
    }
    view.back();
    expect(view.state.mode).toBe("room");
    view.inspect(3);
    view.update(1);
    expect(view.showExitGuide).toBe(false);
  });

  it("再訪時は最初の紙から退出でき、末尾でも案内を出さない", () => {
    const view = setup(true);
    view.back();
    expect(view.state.mode).toBe("room");
    view.inspect(3);
    view.update(1);
    expect(view.restricted).toBe(false);
    expect(view.showExitGuide).toBe(false);
  });

  it("解禁後に設備へ移動した場合も、その後は案内を出さない", () => {
    const view = setup(false);
    for (let index = 0; index < 3; index++) {
      view.advanceNotice(1);
      view.update(1);
    }
    view.inspectComputer();
    view.inspect(3);
    view.update(1);
    expect(view.showExitGuide).toBe(false);
  });
});
