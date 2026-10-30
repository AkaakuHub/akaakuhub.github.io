import { describe, expect, it, vi } from "vite-plus/test";
import { createListenerUpdater } from "./listener";
import type { ListenerPose } from "./listener";

const pose: ListenerPose = [1, 2, 3, 0, 0, -1, 0, 1, 0];

describe("音声リスナーの更新", () => {
  it("AudioParamを持たないFirefoxでも位置と向きを更新する", () => {
    const listener = { setPosition: vi.fn(), setOrientation: vi.fn() };
    const update = createListenerUpdater(listener);
    update(pose, 0);
    update(pose, 1);
    expect(listener.setPosition).toHaveBeenCalledExactlyOnceWith(1, 2, 3);
    expect(listener.setOrientation).toHaveBeenCalledExactlyOnceWith(0, 0, -1, 0, 1, 0);
  });

  it("AudioParam対応環境では未対応のcancelAndHoldAtTimeに依存せず追従する", () => {
    const parameter = { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
    const listener = {
      setPosition: vi.fn(),
      setOrientation: vi.fn(),
      positionX: parameter,
      positionY: parameter,
      positionZ: parameter,
      forwardX: parameter,
      forwardY: parameter,
      forwardZ: parameter,
      upX: parameter,
      upY: parameter,
      upZ: parameter,
    };
    const update = createListenerUpdater(listener);
    update(pose, 0);
    update([2, 2, 3, 0, 0, -1, 0, 1, 0], 1);
    expect(parameter.setValueAtTime).toHaveBeenCalledTimes(9);
    expect(parameter.setTargetAtTime).toHaveBeenCalledExactlyOnceWith(2, 1, 0.015);
    expect(listener.setPosition).not.toHaveBeenCalled();
  });
});
