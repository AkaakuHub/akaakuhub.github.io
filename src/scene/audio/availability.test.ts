import { describe, expect, it } from "vite-plus/test";
import { hasWeatherSound } from "./availability";

describe("天候音の操作が必要な状態", () => {
  it.each([
    [0, 0, false],
    [0, 0.5, false],
    [0, 0.6, true],
    [0.01, 0, true],
    [2, 4, true],
  ])("雨量%s・風速%sでは表示=%s", (rain, windSpeed, expected) => {
    expect(hasWeatherSound({ rain, windSpeed, windDirection: 0 })).toBe(expected);
  });
});
