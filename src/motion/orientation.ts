export interface OrientationSample {
  beta: number;
  gamma: number;
}

function angleDifference(value: number, origin: number): number {
  return ((((value - origin + 180) % 360) + 360) % 360) - 180;
}

export function relativeTilt(
  sample: OrientationSample,
  origin: OrientationSample,
  screenAngle: number,
): { x: number; y: number } {
  const beta = angleDifference(sample.beta, origin.beta);
  const gamma = angleDifference(sample.gamma, origin.gamma);
  const angle = (screenAngle * Math.PI) / 180;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value / 30));
  return {
    x: clamp(gamma * Math.cos(angle) + beta * Math.sin(angle)),
    y: clamp(beta * Math.cos(angle) - gamma * Math.sin(angle)),
  };
}
