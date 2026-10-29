import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";

export type RoomDirection = 0 | 1 | 2 | 3 | 4;
export type ViewState =
  | { readonly mode: "room"; readonly direction: RoomDirection }
  | { readonly mode: "notice"; readonly index: number }
  | { readonly mode: "computer" }
  | { readonly mode: "screen" };
export interface InspectionTarget {
  object: Object3D;
  width: number;
  height: number;
  depth: number;
  offsetY: number;
  topAligned: boolean;
}
export interface InspectionViewport {
  width: number;
  height: number;
  insetX: number;
  insetY: number;
}
export interface InspectionFraming {
  zoom: number;
  panX: number;
  panY: number;
}
export interface CameraPose {
  position: Vector3;
  quaternion: Quaternion;
  fov: number;
}

export function isRoomDirection(index: number): index is RoomDirection {
  return Number.isInteger(index) && index >= 0 && index < 5;
}

export function roomPose(direction: RoomDirection, heading: number, aspect: number): CameraPose {
  const yaw = ((direction < 4 ? direction : heading) * Math.PI) / 2;
  const pitch = direction === 4 ? Math.PI / 2 : MathUtils.degToRad(direction === 1 ? -11 : -8);
  const fittingFov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(34)) / aspect));
  return {
    position: new Vector3(0, 1.55, aspect < 0.7 && direction === 0 ? 0.9 : 0.45),
    quaternion: new Quaternion().setFromEuler(new Euler(pitch, yaw, 0, "YXZ")),
    fov: MathUtils.clamp(fittingFov, 62, direction === 1 ? 70 : 88),
  };
}

export function inspectionBounds(
  target: InspectionTarget,
  viewport: InspectionViewport,
  zoom: number,
) {
  const halfAngle = Math.tan(MathUtils.degToRad(55 / 2));
  const aspect = viewport.width / viewport.height;
  const widthFraction = Math.max(1, viewport.width - viewport.insetX * 2) / viewport.width;
  const heightFraction = Math.max(1, viewport.height - viewport.insetY * 2) / viewport.height;
  const distance =
    Math.max(
      target.width / (2 * halfAngle * aspect * 0.94),
      target.height / (2 * halfAngle * 0.9),
      target.width / (2 * halfAngle * aspect * widthFraction),
      target.height / (2 * halfAngle * heightFraction),
    ) / zoom;
  const visibleHeight = distance * 2 * halfAngle;
  const visibleWidth = visibleHeight * aspect;
  return {
    distance,
    visibleWidth,
    visibleHeight,
    maxX: Math.max(0, (target.width - visibleWidth) / 2),
    maxY: Math.max(0, (target.height - visibleHeight) / 2),
  };
}

export function inspectionPose(
  target: InspectionTarget,
  viewport: InspectionViewport,
  framing: InspectionFraming,
): CameraPose {
  target.object.updateWorldMatrix(true, false);
  const bounds = inspectionBounds(target, viewport, framing.zoom);
  const quaternion = target.object.getWorldQuaternion(new Quaternion());
  const position = target.object.getWorldPosition(new Vector3());
  position.add(
    new Vector3(
      MathUtils.clamp(framing.panX, -bounds.maxX, bounds.maxX),
      target.offsetY +
        MathUtils.clamp(framing.panY, -bounds.maxY, bounds.maxY) -
        (target.topAligned && viewport.height > viewport.width
          ? Math.max(0, bounds.visibleHeight - target.height) * 0.36
          : 0),
      bounds.distance + target.depth / 2,
    ).applyQuaternion(quaternion),
  );
  return { position, quaternion, fov: 55 };
}
