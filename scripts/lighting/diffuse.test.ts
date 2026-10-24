import { Vector3 } from "three";
import { describe, expect, it } from "vite-plus/test";
import { sampleDiffuse } from "./diffuse";

describe("反射光の重点サンプリング", () => {
  it("灯具へ重点を置いても一様な半球の光量を保存する", () => {
    const point = new Vector3(0.4, 1.6, 2.59);
    const count = 8192;
    for (const normal of [new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)]) {
      for (let bounce = 0; bounce < 4; bounce++) {
        let total = 0;
        for (let index = 0; index < count; index++)
          total += sampleDiffuse(point, normal, index, count, bounce).weight;
        expect(Math.abs(total / count - 1)).toBeLessThan(0.02);
      }
    }
  });
});
