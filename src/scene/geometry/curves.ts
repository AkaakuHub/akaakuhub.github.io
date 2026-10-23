import { LatheGeometry, TubeGeometry } from "three";
import type { Curve, Vector2, Vector3 } from "three";

export function latheGeometry(profile: Vector2[], segments: number): LatheGeometry {
  const geometry = new LatheGeometry(profile, segments);
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index++) {
    const radius = Math.hypot(positions.getX(index), positions.getZ(index));
    uv.setXY(index, uv.getX(index) * Math.PI * 2 * radius, positions.getY(index));
  }
  return geometry;
}

export function tubeGeometry(
  path: Curve<Vector3>,
  segments: number,
  radius: number,
  radialSegments: number,
  closed: boolean,
): TubeGeometry {
  const geometry = new TubeGeometry(path, segments, radius, radialSegments, closed);
  const uv = geometry.getAttribute("uv");
  const length = path.getLength();
  for (let index = 0; index < uv.count; index++)
    uv.setXY(index, uv.getX(index) * length, uv.getY(index) * Math.PI * 2 * radius);
  return geometry;
}
