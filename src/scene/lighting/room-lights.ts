import { AmbientLight, Box3, RectAreaLight, Vector3 } from "three";
import type { Color, Scene } from "three";
import {
  fixtureEmitterWidth,
  fixtureHeight,
  fixturePositions,
  fluorescentColor,
  tubeLength,
} from "./fixtures";
import { photometry } from "./photometry";

export function createRoomLights(scene: Scene) {
  const intensity =
    (2 * photometry.tubeLumens * photometry.scale) / (Math.PI * fixtureEmitterWidth * tubeLength);
  const lights = fixturePositions.flatMap((z) => {
    const light = new RectAreaLight(
      fluorescentColor,
      intensity * 0.8,
      fixtureEmitterWidth,
      tubeLength,
    );
    light.position.set(0, fixtureHeight - 0.02, z);
    light.rotation.x = -Math.PI / 2;
    const upward = new RectAreaLight(
      fluorescentColor,
      intensity * 0.2,
      fixtureEmitterWidth,
      tubeLength,
    );
    upward.position.set(0, fixtureHeight + 0.06, z);
    upward.rotation.x = Math.PI / 2;
    scene.add(light, upward);
    return [light, upward].map((emitter) => ({ light: emitter, intensity: emitter.intensity }));
  });
  const surfaceArea = 2 * 5.4 * 5.4 + 4 * 5.4 * 2.9;
  const reflectedIntensity =
    (fixturePositions.length * 2 * photometry.tubeLumens * photometry.scale) / surfaceArea;
  const reflected = new AmbientLight(fluorescentColor, reflectedIntensity);
  scene.add(reflected);
  const bounds = new Box3();
  for (const name of ["room-window-upper-pane", "room-window-lower-pane"])
    for (const pane of scene.getObjectsByProperty("name", name)) bounds.expandByObject(pane);
  if (bounds.isEmpty()) throw new Error("天空光の窓が見つかりません。");
  const size = bounds.getSize(new Vector3());
  const sky = new RectAreaLight(0xffffff, 0, size.z, size.y);
  sky.name = "window-sky-light";
  bounds.getCenter(sky.position);
  sky.rotation.y = -Math.PI / 2;
  scene.add(sky);
  return {
    setRoomLightLevel(level: number): void {
      for (const entry of lights) entry.light.intensity = entry.intensity * level;
      reflected.intensity = reflectedIntensity * level;
    },
    updateSky(color: Color, intensity: number): void {
      sky.color.copy(color);
      sky.intensity = intensity;
    },
  };
}
