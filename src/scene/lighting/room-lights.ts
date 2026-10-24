import { RectAreaLight } from "three";
import type { Scene } from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { fixtureHeight, fixturePositions, fluorescentColor, tubeLength } from "./fixtures";
import { photometry } from "./photometry";

export function createRoomLights(scene: Scene): (on: boolean) => void {
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
  return (on) => {
    for (const light of lights) light.intensity = on ? intensity : 0;
  };
}
