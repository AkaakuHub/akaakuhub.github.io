import { Object3D } from "three";
import { describe, expect, it } from "vite-plus/test";
import { passageApproach, passageJourneyAt } from "./passage-journey";

describe("ドアの先への移動", () => {
  it("向きを変えてから前進し、到着時に視界を白くする", () => {
    expect(passageJourneyAt(0, false)).toEqual({
      turn: 0,
      travel: 0,
      opacity: 0,
      respawn: false,
      done: false,
    });
    expect(passageJourneyAt(0.3, false).travel).toBe(0);
    expect(passageJourneyAt(0.35, false).turn).toBe(1);
    const arrival = passageJourneyAt(1.8, false);
    expect(arrival).toEqual({ turn: 1, travel: 1, opacity: 1, respawn: true, done: false });
  });

  it("リスポーンの前後を白で覆い、戻った後に視界を戻す", () => {
    for (const seconds of [1.8, 1.9, 2]) expect(passageJourneyAt(seconds, false).opacity).toBe(1);
    const fading = passageJourneyAt(2.3, false);
    expect(fading.respawn).toBe(true);
    expect(fading.opacity).toBeGreaterThan(0);
    expect(fading.opacity).toBeLessThan(1);
    expect(passageJourneyAt(3, false)).toMatchObject({ opacity: 0, done: true });
  });

  it("動きを抑える設定ではカメラを動かさず、白くしてからリスポーンする", () => {
    for (const seconds of [0, 0.2, 0.4, 0.6, 1.25])
      expect(passageJourneyAt(seconds, true)).toMatchObject({ turn: 0, travel: 0 });
    expect(passageJourneyAt(0.4, true)).toMatchObject({ opacity: 1, respawn: true, done: false });
    expect(passageJourneyAt(1.3, true)).toMatchObject({ opacity: 0, done: true });
  });
});

describe("出入口への到達位置", () => {
  it.each([
    { x: 2.63, yaw: -Math.PI / 2, expected: 2.49 },
    { x: -2.695, yaw: Math.PI / 2, expected: -2.555 },
  ])("ドアと窓のどちらでも面を突き抜けず、手前で止まる: $x", ({ x, yaw, expected }) => {
    const surface = new Object3D();
    surface.position.set(x, 1.1, 0.95);
    surface.rotation.y = yaw;
    const destination = passageApproach(surface, 1.55);
    expect(destination.x).toBeCloseTo(expected);
    expect(destination.y).toBe(1.55);
    expect(destination.z).toBeCloseTo(0.95);
  });
});
