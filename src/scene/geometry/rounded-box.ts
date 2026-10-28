import { BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { metricBoxUv } from "../materials/uv";

const geometries = new Map<string, BufferGeometry>();

export function roundedBoxGeometry(
  size: readonly [number, number, number],
  radius: number,
  segments = 2,
): BufferGeometry {
  const key = [...size, radius, segments].join(":");
  const existing = geometries.get(key);
  if (existing) return existing;
  const source = new RoundedBoxGeometry(...size, segments, radius);
  metricBoxUv(source);
  const transferable = new BufferGeometry().copy(source);
  const geometry = mergeVertices(transferable, 0.0000001);
  transferable.dispose();
  source.dispose();
  geometries.set(key, geometry);
  return geometry;
}
