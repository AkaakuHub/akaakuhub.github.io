import { Box3, RectAreaLight, Vector3 } from "three";
import type { Color, Scene } from "three";
import { fixtureEmitterWidth, fixturePositions, fluorescentColor, tubeLength } from "./fixtures";
import { photometry } from "./photometry";
import { createFixtureLight } from "./fixture-shadow";

export function createRoomLights(scene: Scene) {
  const intensity =
    (2 * photometry.tubeLumens * photometry.scale) / (Math.PI * fixtureEmitterWidth * tubeLength);
  const lights = fixturePositions.map((z) => {
    const light = createFixtureLight(fluorescentColor, intensity, z);
    scene.add(light, light.target);
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
    invalidateShadows(): void {
      for (const light of lights) light.shadow.needsUpdate = true;
    },
    setRoomLightLevel(level: number): void {
      for (const light of lights) light.intensity = intensity * level;
    },
    updateSky(color: Color, intensity: number): void {
      sky.color.copy(color);
      sky.intensity = intensity;
    },
  };
}
