import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { metricBoxUv } from "../materials/uv";

const geometries = new Map<string, BufferGeometry>();
const templates = new Map<number, { geometry: BoxGeometry; directions: Float64Array }>();

function template(segments: number) {
  const existing = templates.get(segments);
  if (existing) return existing;
  const count = segments * 2 + 1;
  const geometry = new BoxGeometry(1, 1, 1, count, count, count);
  const positions = geometry.getAttribute("position");
  const directions = new Float64Array(positions.count * 3);
  const normal = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    normal.fromBufferAttribute(positions, index);
    normal
      .set(
        normal.x - Math.sign(normal.x) * (0.5 / count),
        normal.y - Math.sign(normal.y) * (0.5 / count),
        normal.z - Math.sign(normal.z) * (0.5 / count),
      )
      .normalize();
    normal.toArray(directions, index * 3);
  }
  const result = { geometry, directions };
  templates.set(segments, result);
  return result;
}

export function roundedBoxGeometry(
  size: readonly [number, number, number],
  radius: number,
  segments = 2,
): BufferGeometry {
  const key = [...size, radius, segments].join(":");
  const existing = geometries.get(key);
  if (existing) return existing;
  const source = template(segments);
  const geometry = new BufferGeometry().copy(source.geometry);
  const positions = geometry.getAttribute("position");
  const normals = new Float32BufferAttribute(source.directions, 3);
  const roundedRadius = Math.min(...size.map((length) => length / 2), radius);
  for (let index = 0; index < positions.count; index++) {
    const offset = index * 3;
    positions.setXYZ(
      index,
      (size[0] / 2 - roundedRadius) * Math.sign(positions.getX(index)) +
        source.directions[offset]! * roundedRadius,
      (size[1] / 2 - roundedRadius) * Math.sign(positions.getY(index)) +
        source.directions[offset + 1]! * roundedRadius,
      (size[2] / 2 - roundedRadius) * Math.sign(positions.getZ(index)) +
        source.directions[offset + 2]! * roundedRadius,
    );
  }
  geometry.setAttribute("normal", normals);
  metricBoxUv(geometry);
  geometries.set(key, geometry);
  return geometry;
}
