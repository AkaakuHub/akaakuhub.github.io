import { MathUtils } from "three";

export function doorJourneyAt(seconds: number, reducedMotion: boolean) {
  const arrival = reducedMotion ? 0.4 : 1.8;
  const fadeStart = arrival + 0.2;
  const end = fadeStart + 0.65;
  return {
    turn: reducedMotion ? 0 : MathUtils.smootherstep(seconds, 0, 0.35),
    travel: reducedMotion ? 0 : MathUtils.smootherstep(seconds, 0.3, arrival),
    white:
      seconds < fadeStart
        ? MathUtils.smoothstep(seconds, reducedMotion ? 0 : 0.9, arrival)
        : 1 - MathUtils.smoothstep(seconds, fadeStart, end),
    respawn: seconds >= arrival,
    done: seconds >= end,
  };
}
