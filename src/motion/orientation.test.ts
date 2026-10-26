import { describe, expect, it } from "vite-plus/test";
import { relativeTilt } from "./orientation";

describe("端末の傾き", () => {
  it("オンにした向きを基準にして、姿勢を変えなければ視点を動かさない", () => {
    const origin = { beta: 70, gamma: -12 };
    expect(relativeTilt(origin, origin, 0)).toEqual({ x: 0, y: 0 });
  });

  it("縦画面で左右と前後の傾きを区別する", () => {
    expect(relativeTilt({ beta: 75, gamma: 15 }, { beta: 60, gamma: 0 }, 0)).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });

  it("横画面では画面の向きに合わせて傾きの軸を回す", () => {
    const result = relativeTilt({ beta: 75, gamma: 0 }, { beta: 60, gamma: 0 }, 90);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0);
  });

  it("角度の境界をまたいでも小さな差として扱う", () => {
    const result = relativeTilt({ beta: -179, gamma: 0 }, { beta: 179, gamma: 0 }, 0);
    expect(result.y).toBeCloseTo(2 / 30);
  });

  it("大きく傾けても視点へ渡す移動量を制限する", () => {
    expect(relativeTilt({ beta: 150, gamma: -80 }, { beta: 60, gamma: 0 }, 0)).toEqual({
      x: -1,
      y: 1,
    });
  });
});
