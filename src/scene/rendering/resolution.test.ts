import { describe, expect, it } from "vite-plus/test";
import { fitPixelBudget } from "./resolution";

describe("移動中の描画画素数", () => {
  it("移動中のスマホの縦画面を22万画素以内に収め、縦横比を維持する", () => {
    const size = fitPixelBudget(780, 1688, 220_000);
    expect(size.width * size.height).toBeLessThanOrEqual(220_000);
    expect(Math.abs(size.width / size.height - 780 / 1688)).toBeLessThan(0.002);
  });
  it("移動中のPC画面を65万画素以内に収め、縦横比を維持する", () => {
    const size = fitPixelBudget(2560, 1440, 650_000);
    expect(size.width * size.height).toBeLessThanOrEqual(650_000);
    expect(Math.abs(size.width / size.height - 2560 / 1440)).toBeLessThan(0.002);
  });
  it("小さい画面を拡大しない", () => {
    expect(fitPixelBudget(390, 844, 500_000)).toEqual({ width: 390, height: 844 });
  });
  it("極端な縦長でも上限を超えず、ゼロ画素を作らない", () => {
    const size = fitPixelBudget(1, 1_000_000, 500_000);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
    expect(size.width * size.height).toBeLessThanOrEqual(500_000);
  });
});
