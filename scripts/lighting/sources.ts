import { Vector3 } from "three";
import {
  fixtureHeight,
  fixturePositions,
  fluorescentRadiance,
  tubeLength,
  tubeRadius,
} from "../../src/scene/lighting/fixtures";
import type { BakeScene } from "./scene";

export function createLightSampler(scene: BakeScene) {
  const tubes: Vector3[] = [];
  const windows: Vector3[] = [];
  const count = 32;
  for (const z of fixturePositions)
    for (const x of [-0.085, 0.085])
      for (let index = 0; index < count; index++)
        tubes.push(new Vector3(x, fixtureHeight, z + ((index + 0.5) / count - 0.5) * tubeLength));
  for (let y = 0; y < 4; y++)
    for (let z = 0; z < 6; z++)
      windows.push(
        new Vector3(-2.625, 1.045 + ((y + 0.5) / 4) * 1.48, ((z + 0.5) / 6) * 3.8 - 1.9),
      );
  const tubeWeight = ((2 * tubeRadius * tubeLength) / count) * fluorescentRadiance;
  const windowArea = (3.8 * 1.48) / windows.length;
  const direction = new Vector3();
  function direct(point: Vector3, normal: Vector3) {
    const origin = point.clone().addScaledVector(normal, 0.001);
    let fluorescent = 0;
    let sky = 0;
    for (const source of tubes) {
      direction.subVectors(source, origin);
      const distance = direction.length();
      direction.divideScalar(distance);
      const cosine = Math.max(0, normal.dot(direction));
      if (cosine === 0) continue;
      const projected = Math.sqrt(Math.max(0, 1 - direction.z * direction.z));
      fluorescent +=
        ((tubeWeight * cosine * projected) /
          Math.max(distance * distance, tubeRadius * tubeRadius)) *
        scene.visibility(origin, direction, distance - 0.0002, true);
    }
    for (const source of windows) {
      direction.subVectors(source, origin);
      const distance = direction.length();
      direction.divideScalar(distance);
      const cosine = Math.max(0, normal.dot(direction)) * Math.max(0, -direction.x);
      if (cosine === 0) continue;
      sky +=
        ((windowArea * cosine) / (distance * distance)) *
        scene.visibility(origin, direction, distance - 0.0002);
    }
    return { fluorescent, sky };
  }
  const cache = new Map<string, ReturnType<typeof direct>>();
  function indirect(point: Vector3, normal: Vector3) {
    const key = [
      ...point.toArray().map((value) => Math.round(value / 0.05)),
      ...normal.toArray().map((value) => Math.round(value * 32)),
    ].join(",");
    let value = cache.get(key);
    if (!value) {
      value = direct(point, normal);
      cache.set(key, value);
    }
    return value;
  }
  return { direct, indirect };
}
