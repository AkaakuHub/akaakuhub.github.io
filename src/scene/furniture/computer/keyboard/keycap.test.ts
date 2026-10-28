import { describe, expect, it } from "vite-plus/test";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { keycapGeometry, pitch, topHeight } from "./keycap";
import type { Key } from "./layout";

const key: Key = { label: "A", x: 0, row: 3.5, units: 1, rows: 1 };

describe("キーキャップの形状の共有", () => {
  it("配置と刻印が異なっても同じ形状を共有する", () => {
    expect(keycapGeometry(key)).toBe(keycapGeometry({ ...key, label: "Q", x: 2, row: 2.5 }));
    expect(keycapGeometry(key)).not.toBe(keycapGeometry({ ...key, units: 1.25 }));
    expect(keycapGeometry({ ...key, units: 4, shape: "space" })).not.toBe(
      keycapGeometry({ ...key, units: 4 }),
    );
  });

  it("丸みと指先のくぼみ・法線・UV・三角形数を保つ", () => {
    const height = 0.0095;
    const original = new RoundedBoxGeometry(pitch - 0.0015, height, pitch - 0.0015, 1, 0.0012);
    const positions = original.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      if (positions.getY(index) < height / 2 - 0.00001) continue;
      positions.setY(index, topHeight(key, positions.getX(index), positions.getZ(index)));
    }
    original.computeVertexNormals();
    const indexed = keycapGeometry(key);
    const expanded = indexed.toNonIndexed();
    for (const name of ["position", "normal", "uv"]) {
      const source = original.getAttribute(name);
      const result = expanded.getAttribute(name);
      expect(result.count).toBe(source.count);
      for (let index = 0; index < source.array.length; index++)
        expect(Math.abs(source.array[index]! - result.array[index]!)).toBeLessThan(0.0000001);
    }
    expect(indexed.getAttribute("position").count).toBeLessThan(positions.count);
    expanded.dispose();
    original.dispose();
  });
});
