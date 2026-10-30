import { describe, expect, it } from "vite-plus/test";
import { noticeLightScale, noticeSurface } from "./notice-light";

describe("掲示面への自然光", () => {
  it("掲示面の直射光を弱め、天空光と室内灯を維持する", () => {
    expect(noticeLightScale(noticeSurface, "sun")).toBeLessThan(0.2);
    expect(noticeLightScale(noticeSurface, "sky")).toBe(1);
    expect(noticeLightScale(noticeSurface, "lamp")).toBe(1);
  });

  it("壁や家具や窓の外の照明は変えない", () => {
    for (const name of ["", "exterior-surface", "computer-screen"])
      for (const source of ["sun", "sky", "lamp"] as const)
        expect(noticeLightScale(name, source)).toBe(1);
  });
});
