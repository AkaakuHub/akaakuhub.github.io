import { Color, Light, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from "three";
import { describe, expect, it } from "vite-plus/test";
import { fluorescentModulation } from "./fluorescent-modulation";
import { createRoomLights } from "./room-lights";

describe("蛍光灯の微弱な明るさの変化", () => {
  it("初期値を通常の明るさにする", () => {
    expect(fluorescentModulation(0)).toBe(1);
  });

  it("変化幅を通常の明るさの±0.15%以内に保つ", () => {
    for (let index = 0; index < 10000; index++) {
      const value = fluorescentModulation(index * 0.137);
      expect(value).toBeGreaterThanOrEqual(0.9985);
      expect(value).toBeLessThanOrEqual(1.0015);
    }
  });

  it("明るさが不連続に切り替わらない", () => {
    for (let index = 0; index < 1000; index++) {
      const seconds = index * 0.1;
      const difference = Math.abs(
        fluorescentModulation(seconds + 0.001) - fluorescentModulation(seconds),
      );
      expect(difference).toBeLessThan(0.00002);
    }
  });

  it("蛍光灯の変化を天空光へ適用しない", () => {
    const scene = new Scene();
    const pane = new Mesh(new PlaneGeometry(2, 1.5), new MeshBasicMaterial());
    pane.name = "room-window-upper-pane";
    scene.add(pane);
    const fixtures = createRoomLights(scene);
    fixtures.updateSky(new Color(0xffffff), 0.5);
    const lights = scene.children.filter(
      (object): object is Light => object instanceof Light && object.name !== "window-sky-light",
    );
    const initial = lights.map((light) => light.intensity);
    fixtures.setRoomLightLevel(1.0015);
    for (const [index, light] of lights.entries())
      expect(light.intensity).toBeCloseTo(initial[index]! * 1.0015);
    expect(scene.getObjectByName("window-sky-light")).toHaveProperty("intensity", 0.5);
    fixtures.setRoomLightLevel(0);
    for (const light of lights) expect(light.intensity).toBe(0);
    expect(scene.getObjectByName("window-sky-light")).toHaveProperty("intensity", 0.5);
  });
});
