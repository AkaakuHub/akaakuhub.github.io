import { MathUtils } from "three";

function airMass(altitude: number): number {
  const sine = Math.sin(MathUtils.degToRad(MathUtils.clamp(altitude, 0, 90)));
  return (
    (1.002432 * sine * sine + 0.148386 * sine + 0.0096467) /
    (sine ** 3 + 0.149864 * sine * sine + 0.0102963 * sine + 0.000303978)
  );
}

const referenceAirMass = airMass(30);
const lunarDistance = 60.2666 * 6378.137;

export function celestialVisibility(altitude: number): number {
  const disk = MathUtils.smoothstep(altitude, -0.27, 0.27);
  return disk * Math.exp(-0.12 * Math.max(0, airMass(altitude) - referenceAirMass));
}

export function lunarIrradiance(illuminatedFraction: number, distance: number): number {
  const phaseAngle = MathUtils.radToDeg(
    Math.acos(2 * MathUtils.clamp(illuminatedFraction, 0, 1) - 1),
  );
  const magnitudeDifference = 0.026 * phaseAngle + 4e-9 * phaseAngle ** 4;
  return 10 ** (-0.4 * magnitudeDifference) * (lunarDistance / distance) ** 2;
}
