import { describe, expect, it } from "vite-plus/test";
import { fitPixelBudget, renderingSize } from "./resolution";

describe("移動中の描画画素数", () => {
  it("移動中のスマホの縦画面を22万画素以内に収め、縦横比を維持する", () => {
    const size = fitPixelBudget(780, 1688, 220_000, 1920);
    expect(size.width * size.height).toBeLessThanOrEqual(220_000);
    expect(Math.abs(size.width / size.height - 780 / 1688)).toBeLessThan(0.002);
  });
  it("移動中のPC画面を65万画素以内に収め、縦横比を維持する", () => {
    const size = fitPixelBudget(2560, 1440, 650_000, 1920);
    expect(size.width * size.height).toBeLessThanOrEqual(650_000);
    expect(Math.abs(size.width / size.height - 2560 / 1440)).toBeLessThan(0.002);
  });
  it("小さい画面を拡大しない", () => {
    expect(fitPixelBudget(390, 844, 500_000, 1920)).toEqual({ width: 390, height: 844 });
  });
  it("極端な縦長でも上限を超えず、ゼロ画素を作らない", () => {
    const size = fitPixelBudget(1, 1_000_000, 500_000, 1920);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
    expect(size.width * size.height).toBeLessThanOrEqual(500_000);
  });

  it.each([
    [3840, 2160, 1],
    [3840, 2160, 3],
    [7680, 4320, 2],
    [2160, 3840, 2],
    [16384, 4096, 4],
  ])("高解像度でも画素数と最大寸法を超えない: %s×%s DPR%s", (width, height, ratio) => {
    const size = renderingSize(width, height, ratio, {
      pixelBudget: 1920 * 1080,
      pixelRatio: 2,
      maxDimension: 1920,
    });
    expect(size.width * size.height).toBeLessThanOrEqual(1920 * 1080);
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(1920);
    expect(Math.abs(size.width / size.height - width / height)).toBeLessThan(0.01);
  });

  it("4Kも8Kも16:9なら1920×1080で描画する", () => {
    const limits = { pixelBudget: 1920 * 1080, pixelRatio: 2, maxDimension: 1920 };
    expect(renderingSize(3840, 2160, 2, limits)).toEqual({ width: 1920, height: 1080 });
    expect(renderingSize(7680, 4320, 2, limits)).toEqual({ width: 1920, height: 1080 });
  });

  it.each([
    [1_000_000, 1],
    [1, 1_000_000],
  ])("極端な縦横比と小さい上限でも確保量を超えない", (width, height) => {
    const size = fitPixelBudget(width, height, 1, 1920);
    expect(size).toEqual({ width: 1, height: 1 });
  });

  it.each([
    [0, 1080],
    [1920, 0],
    [Number.NaN, 1080],
    [Number.POSITIVE_INFINITY, 1080],
  ])("不正な寸法をGPUへ渡さない: %s×%s", (width, height) => {
    expect(() => fitPixelBudget(width, height, 1920 * 1080, 1920)).toThrow();
  });
});
