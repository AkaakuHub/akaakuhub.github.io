import { Euler, MathUtils, Quaternion, Vector2, Vector3 } from "three";
import type { PerspectiveCamera } from "three";

export function createMotionOffset() {
  const target = new Vector2();
  const current = new Vector2();
  const offset = new Vector3();
  const rotation = new Quaternion();
  const angles = new Euler(0, 0, 0, "YXZ");
  return {
    setTarget(x: number, y: number): boolean {
      const nextX = MathUtils.clamp(x, -1, 1);
      const nextY = MathUtils.clamp(y, -1, 1);
      if (nextX === target.x && nextY === target.y) return false;
      if ((nextX !== 0 || nextY !== 0) && Math.hypot(nextX - target.x, nextY - target.y) < 0.005)
        return false;
      target.set(nextX, nextY);
      return true;
    },
    apply(camera: PerspectiveCamera, seconds: number): boolean {
      const previousX = current.x;
      const previousY = current.y;
      current.lerp(target, 1 - Math.exp(-10 * Math.min(seconds, 0.1)));
      if (current.distanceToSquared(target) < 0.000001) current.copy(target);
      offset.set(current.x * 0.02, -current.y * 0.015, 0).applyQuaternion(camera.quaternion);
      camera.position.add(offset);
      angles.set(
        -current.y * MathUtils.degToRad(3),
        -current.x * MathUtils.degToRad(4),
        -current.x * MathUtils.degToRad(1.5),
      );
      camera.quaternion.multiply(rotation.setFromEuler(angles));
      return current.x !== previousX || current.y !== previousY;
    },
  };
}
