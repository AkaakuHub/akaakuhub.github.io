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
  const windows = scene.getObjectsByProperty("name", "room-window-pane").map((pane) => {
    const bounds = new Box3().setFromObject(pane);
    const size = bounds.getSize(new Vector3());
    const light = new RectAreaLight(0xffffff, 0, size.z, size.y);
    bounds.getCenter(light.position);
    light.rotation.y = -Math.PI / 2;
    scene.add(light);
    return light;
  });
  return {
    setRoomLights(on: boolean): void {
      for (const light of lights) light.intensity = on ? intensity : 0;
    },
    updateSky(color: Color, intensity: number): void {
      for (const light of windows) {
        light.color.copy(color);
        light.intensity = intensity;
      }
    },
  };
}
