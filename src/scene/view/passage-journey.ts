import { MathUtils, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";

export function passageApproach(surface: Object3D, height: number, clearance: number): Vector3 {
  const destination = surface.getWorldPosition(new Vector3());
  const orientation = surface.getWorldQuaternion(new Quaternion());
  destination.add(new Vector3(0, 0, clearance).applyQuaternion(orientation));
  destination.y = height;
  return destination;
}

export function passageJourneyAt(seconds: number, reducedMotion: boolean) {
  const arrival = reducedMotion ? 0.4 : 1.8;
  const fadeStart = arrival + 0.2;
  const end = fadeStart + 0.65;
  return {
    turn: reducedMotion ? 0 : MathUtils.smootherstep(seconds, 0, 0.35),
    travel: reducedMotion ? 0 : MathUtils.smootherstep(seconds, 0.3, arrival),
    opacity:
      seconds < fadeStart
        ? MathUtils.smoothstep(seconds, reducedMotion ? 0 : 0.6, reducedMotion ? arrival : 1.4)
        : 1 - MathUtils.smoothstep(seconds, fadeStart, end),
    respawn: seconds >= arrival,
    done: seconds >= end,
  };
}
