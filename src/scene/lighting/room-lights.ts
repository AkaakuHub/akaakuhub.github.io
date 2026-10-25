import { Box3, RectAreaLight, Vector3 } from "three";
import type { Color, Scene } from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { fixtureHeight, fixturePositions, fluorescentColor, tubeLength } from "./fixtures";
import { photometry } from "./photometry";

export function createRoomLights(scene: Scene) {
  RectAreaLightUniformsLib.init();
  const width = 0.22;
  const intensity = (2 * photometry.tubeLumens * photometry.scale) / (Math.PI * width * tubeLength);
  const lights = fixturePositions.map((z) => {
    const light = new RectAreaLight(fluorescentColor, intensity, width, tubeLength);
    light.position.set(0, fixtureHeight - 0.02, z);
    light.rotation.x = -Math.PI / 2;
    scene.add(light);
    return light;
  });
  const bounds = new Box3();
  for (const pane of scene.getObjectsByProperty("name", "room-window-pane"))
    bounds.expandByObject(pane);
  if (bounds.isEmpty()) throw new Error("天空光の窓が見つかりません。");
  const size = bounds.getSize(new Vector3());
  const sky = new RectAreaLight(0xffffff, 0, size.z, size.y);
  bounds.getCenter(sky.position);
  sky.rotation.y = -Math.PI / 2;
  scene.add(sky);
  return {
    setRoomLights(on: boolean): void {
      for (const light of lights) light.intensity = on ? intensity : 0;
    },
    updateSky(color: Color, intensity: number): void {
      sky.color.copy(color);
      sky.intensity = intensity;
    },
  };
}
