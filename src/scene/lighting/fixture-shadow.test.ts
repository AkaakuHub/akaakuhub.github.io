import { Color, Scene, Vector3, WebGPUCoordinateSystem } from "three";
import { describe, expect, it } from "vite-plus/test";
import { createFixtureLight } from "./fixture-shadow";
import { fixturePositions } from "./fixtures";

describe("蛍光灯の影の投影", () => {
  it("両方の灯具から床全体を投影し、接地点の影を切らない", () => {
    for (const z of fixturePositions) {
      const scene = new Scene();
      const light = createFixtureLight(new Color(1, 1, 1), 1, z);
      scene.add(light, light.target);
      scene.updateMatrixWorld(true);
      light.shadow.camera.coordinateSystem = WebGPUCoordinateSystem;
      light.shadow.camera.updateProjectionMatrix();
      light.shadow.updateMatrices(light);
      for (const x of [-2.7, 0, 2.7]) {
        for (const depth of [-2.7, 0, 2.7]) {
          const projected = new Vector3(x, 0, depth).applyMatrix4(light.shadow.matrix);
          expect(projected.x).toBeGreaterThanOrEqual(0);
          expect(projected.x).toBeLessThanOrEqual(1);
          expect(projected.y).toBeGreaterThanOrEqual(0);
          expect(projected.y).toBeLessThanOrEqual(1);
          expect(projected.z).toBeGreaterThan(0);
          expect(projected.z).toBeLessThan(1);
        }
      }
    }
  });
});
