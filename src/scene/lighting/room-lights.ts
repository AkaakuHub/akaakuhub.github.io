import { Box3, RectAreaLight, Vector3 } from "three";
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
    const downward = new RectAreaLight(
      fluorescentColor,
      intensity * 0.6,
      fixtureEmitterWidth,
      tubeLength,
    );
    downward.position.set(0, fixtureHeight - 0.02, z);
    downward.rotation.x = -Math.PI / 2;
    const sideways = [-1, 1].map((side) => {
      const light = new RectAreaLight(
        fluorescentColor,
        intensity * 0.2,
        fixtureEmitterWidth,
        tubeLength,
      );
      light.position.set(side * 0.17, fixtureHeight, z);
      light.rotation.set(Math.PI / 2, 0, (-side * Math.PI) / 3);
      return light;
    });
    const emitters = [downward, ...sideways];
    scene.add(...emitters);
    return emitters.map((light) => ({ light, intensity: light.intensity }));
  });
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
    },
    updateSky(color: Color, intensity: number): void {
      sky.color.copy(color);
      sky.intensity = intensity;
    },
  };
}
