import { describe, expect, it } from "vite-plus/test";
import { MotionResolution } from "./motion-resolution";

describe("視点移動中の解像度", () => {
  it("60fpsでは画素数を維持し、連続する遅延では画素数を下げる", () => {
    const resolution = new MotionResolution(650_000);
    for (let frame = 0; frame < 24; frame++) resolution.sample(1 / 60, true);
    expect(resolution.budget).toBe(650_000);
    for (let frame = 0; frame < 12; frame++) resolution.sample(1 / 30, true);
    expect(resolution.budget).toBe(325_000);
  });

  it("静止中の待機時間を判定に含めず、画素数の下限を保つ", () => {
    const resolution = new MotionResolution(220_000);
    resolution.sample(60, false);
    for (let frame = 0; frame < 12; frame++) resolution.sample(1 / 60, true);
    expect(resolution.budget).toBe(220_000);
    for (let frame = 0; frame < 120; frame++) resolution.sample(0.1, true);
    expect(resolution.budget).toBe(110_000);
  });
});
