import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";

export type RoomDirection = 0 | 1 | 2 | 3 | 4 | 5;
export type ViewState =
  | { readonly mode: "room"; readonly direction: RoomDirection }
  | { readonly mode: "notice"; readonly index: number };
export interface InspectionTarget {
  object: Object3D;
  width: number;
  height: number;
}
export interface CameraPose {
  position: Vector3;
  quaternion: Quaternion;
  fov: number;
}

export function isRoomDirection(index: number): index is RoomDirection {
  return Number.isInteger(index) && index >= 0 && index < 6;
}

export function roomPose(direction: RoomDirection, heading: number, aspect: number): CameraPose {
  const yaw = ((direction < 4 ? direction : heading) * Math.PI) / 2;
  const pitch =
    direction === 4 ? Math.PI / 2 : direction === 5 ? -Math.PI / 2 : MathUtils.degToRad(-8);
  const fittingFov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(34)) / aspect));
  return {
    position: new Vector3(0, 1.55, 0.45),
    quaternion: new Quaternion().setFromEuler(new Euler(pitch, yaw, 0, "YXZ")),
    fov: MathUtils.clamp(fittingFov, 62, 82),
  };
}

export function inspectionPose(target: InspectionTarget, aspect: number): CameraPose {
  target.object.updateWorldMatrix(true, false);
  const fov = 55;
  const halfAngle = Math.tan(MathUtils.degToRad(fov / 2));
  const distance = Math.max(
    target.width / (2 * halfAngle * aspect * 0.82),
    target.height / (2 * halfAngle * 0.72),
  );
  const quaternion = target.object.getWorldQuaternion(new Quaternion());
  const position = target.object.getWorldPosition(new Vector3());
  position.add(new Vector3(0, 0, distance).applyQuaternion(quaternion));
  return { position, quaternion, fov };
}
