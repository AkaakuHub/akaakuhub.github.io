import { Vector3 } from "three";
import { fixturePositions } from "../../src/scene/lighting/fixtures";

const fixtureWidth = 0.35;
const fixtureLength = 1.19;
const reflectorHeight = 2.804;

function radicalInverse(index: number): number {
  let result = 0;
  let weight = 0.5;
  while (index > 0) {
    result += (index & 1) * weight;
    index >>>= 1;
    weight *= 0.5;
  }
  return result;
}

function fixtureDensity(point: Vector3, direction: Vector3, z: number): number {
  if (Math.abs(direction.y) < 0.000001) return 0;
  const distance = (reflectorHeight - point.y) / direction.y;
  if (distance <= 0) return 0;
  const x = point.x + direction.x * distance;
  const along = point.z + direction.z * distance - z;
  if (Math.abs(x) > fixtureWidth / 2 || Math.abs(along) > fixtureLength / 2) return 0;
  return (distance * distance) / (fixtureWidth * fixtureLength * Math.abs(direction.y));
}

export function sampleDiffuse(
  point: Vector3,
  normal: Vector3,
  sample: number,
  count: number,
  bounce: number,
) {
  const bits = Math.log2(count);
  if (!Number.isInteger(bits) || count < 16)
    throw new Error("反射光のサンプル数は16以上の2の累乗にしてください。");
  const index = ((sample >>> bounce) | (sample << (bits - bounce))) & (count - 1);
  let direction: Vector3;
  if ((index & 1) === 0) {
    const sequence = index >>> 1;
    const tangent = Math.abs(normal.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
    tangent.cross(normal).normalize();
    const bitangent = new Vector3().crossVectors(normal, tangent);
    const radius = Math.sqrt((sequence + 0.5) / (count / 2));
    const angle = radicalInverse(sequence) * Math.PI * 2 + bounce * 2.399963229728653;
    direction = tangent
      .multiplyScalar(radius * Math.cos(angle))
      .addScaledVector(bitangent, radius * Math.sin(angle))
      .addScaledVector(normal, Math.sqrt(1 - radius * radius));
  } else {
    const fixture = fixturePositions[(index >>> 1) & 1];
    if (fixture === undefined) throw new Error("反射光の光源が見つかりません。");
    const sequence = index >>> 2;
    const x = ((((sequence * 13) % (count / 4)) + 0.5) / (count / 4) - 0.5) * fixtureWidth;
    const z = (radicalInverse(sequence) - 0.5) * fixtureLength + fixture;
    direction = new Vector3(x, reflectorHeight, z).sub(point).normalize();
  }
  const cosine = Math.max(0, normal.dot(direction));
  const density =
    (0.5 * cosine) / Math.PI +
    fixturePositions.reduce((sum, z) => sum + 0.25 * fixtureDensity(point, direction, z), 0);
  return { direction, weight: density === 0 ? 0 : cosine / (Math.PI * density) };
}
