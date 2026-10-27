import {
  Box3,
  BoxGeometry,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Vector3,
} from "three";
import { describe, expect, it } from "vite-plus/test";
import { fitShadowCamera, shadowCasterBounds } from "./shadow-camera";

describe("部室の影の範囲", () => {
  it("影を落とさない空の背景を計算範囲へ含めない", () => {
    const scene = new Scene();
    const room = new Mesh(new BoxGeometry(5.4, 3, 5.4), new MeshBasicMaterial());
    room.castShadow = true;
    const sky = new Mesh(new BoxGeometry(30, 30, 30), new MeshBasicMaterial());
    sky.position.x = -20;
    scene.add(room, sky);
    const bounds = shadowCasterBounds(scene);
    expect(bounds.getSize(new Vector3()).toArray()).toEqual([5.4, 3, 5.4].map(Math.fround));
  });

  it.each([
    [0, 16, 0.001],
    [-12, 6, 8],
    [12, 0.2, -8],
  ])("光の向きが変わっても部室を影の範囲へ収める: %j", (x, y, z) => {
    const light = new DirectionalLight();
    light.position.set(x, y, z);
    light.target.position.set(0, 1.2, 0);
    light.shadow.mapSize.set(1024, 1024);
    const bounds = new Box3(new Vector3(-2.7, -0.12, -2.7), new Vector3(3.4, 3, 2.7));
    fitShadowCamera(light, bounds);
    const camera = light.shadow.camera;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          expect(point.x).toBeGreaterThan(camera.left);
          expect(point.x).toBeLessThan(camera.right);
          expect(point.y).toBeGreaterThan(camera.bottom);
          expect(point.y).toBeLessThan(camera.top);
          expect(-point.z).toBeGreaterThan(camera.near);
          expect(-point.z).toBeLessThan(camera.far);
        }
    expect(light.shadow.mapSize.toArray()).toEqual([1024, 1024]);
    expect(camera.right - camera.left).toBeLessThan(8.8);
    expect(light.shadow.normalBias).toBeLessThan(0.004);
  });
});
