import { describe, expect, it } from "vite-plus/test";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { roundedBoxGeometry } from "./rounded-box";
import { metricBoxUv } from "../materials/uv";

describe("角丸部材の頂点の共有", () => {
  it.each([
    { size: [1.72, 0.048, 0.56] as const, radius: 0.003, segments: 2 },
    { size: [0.0022, 0.25, 0.22] as const, radius: 0.0008, segments: 2 },
    { size: [2.64, 1.8, 0.075] as const, radius: 0.026, segments: 3 },
  ])("形状・法線・木目の座標を保つ: $size", ({ size, radius, segments }) => {
    const original = new RoundedBoxGeometry(...size, segments, radius);
    metricBoxUv(original);
    const indexed = roundedBoxGeometry(size, radius, segments);
    const expanded = indexed.toNonIndexed();
    for (const name of ["position", "normal", "uv"]) {
      expect([...expanded.getAttribute(name).array]).toEqual([
        ...original.getAttribute(name).array,
      ]);
    }
    expect(indexed.getAttribute("position").count).toBeLessThan(
      original.getAttribute("position").count / 2,
    );
    original.dispose();
    expanded.dispose();
  });

  it("同じ寸法と丸みの部材で頂点データを共有する", () => {
    expect(roundedBoxGeometry([0.5, 0.03, 0.4], 0.003)).toBe(
      roundedBoxGeometry([0.5, 0.03, 0.4], 0.003),
    );
    expect(roundedBoxGeometry([0.5, 0.03, 0.4], 0.003)).not.toBe(
      roundedBoxGeometry([0.5, 0.03, 0.4], 0.005),
    );
  });
});
