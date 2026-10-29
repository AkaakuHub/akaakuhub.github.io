import { describe, expect, it } from "vite-plus/test";
import { doorJourneyAt } from "./door-journey";

describe("ドアの先への移動", () => {
  it("向きを変えてから前進し、到着時に視界を白くする", () => {
    expect(doorJourneyAt(0, false)).toEqual({
      turn: 0,
      travel: 0,
      white: 0,
      respawn: false,
      done: false,
    });
    expect(doorJourneyAt(0.3, false).travel).toBe(0);
    expect(doorJourneyAt(0.35, false).turn).toBe(1);
    const arrival = doorJourneyAt(1.8, false);
    expect(arrival).toEqual({ turn: 1, travel: 1, white: 1, respawn: true, done: false });
  });

  it("リスポーンの前後を白で覆い、戻った後に視界を戻す", () => {
    for (const seconds of [1.8, 1.9, 2]) expect(doorJourneyAt(seconds, false).white).toBe(1);
    const fading = doorJourneyAt(2.3, false);
    expect(fading.respawn).toBe(true);
    expect(fading.white).toBeGreaterThan(0);
    expect(fading.white).toBeLessThan(1);
    expect(doorJourneyAt(3, false)).toMatchObject({ white: 0, done: true });
  });

  it("動きを抑える設定ではカメラを動かさず、白くしてからリスポーンする", () => {
    for (const seconds of [0, 0.2, 0.4, 0.6, 1.25])
      expect(doorJourneyAt(seconds, true)).toMatchObject({ turn: 0, travel: 0 });
    expect(doorJourneyAt(0.4, true)).toMatchObject({ white: 1, respawn: true, done: false });
    expect(doorJourneyAt(1.3, true)).toMatchObject({ white: 0, done: true });
  });
});
