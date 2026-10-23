import { MathUtils, Quaternion, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import { inspectionPose, isRoomDirection, roomPose } from "./targets";
import type {
  CameraPose,
  InspectionTarget,
  InspectionViewport,
  RoomDirection,
  ViewState,
} from "./targets";

export type { ViewState } from "./targets";

export function createView(
  camera: PerspectiveCamera,
  inspections: readonly InspectionTarget[],
  onChange: (state: ViewState) => void,
  invalidate: () => void,
  getViewport: () => InspectionViewport,
) {
  if (inspections.length === 0) throw new Error("掲示用紙が配置されていません。");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state: ViewState = { mode: "room", direction: 0 };
  let roomDirection: RoomDirection = 0;
  let heading = 0;
  let start: CameraPose = { position: new Vector3(), quaternion: new Quaternion(), fov: 62 };
  let target = roomPose(0, heading, camera.aspect);
  let elapsed = 1;
  let duration = 1;

  function pose(): CameraPose {
    if (state.mode === "room") return roomPose(state.direction, heading, camera.aspect);
    const inspection = inspections[state.index];
    if (!inspection) throw new Error("掲示用紙の視点が見つかりません。");
    return inspectionPose(inspection, getViewport());
  }
  function apply(result: CameraPose): void {
    camera.position.copy(result.position);
    camera.quaternion.copy(result.quaternion);
    camera.fov = result.fov;
    camera.updateProjectionMatrix();
  }
  function transition(next: ViewState, seconds: number): void {
    state = next;
    start = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      fov: camera.fov,
    };
    onChange(state);
    target = pose();
    elapsed = 0;
    duration = seconds;
    invalidate();
  }
  function select(index: number): void {
    if (!isRoomDirection(index)) throw new Error("部屋の向きが見つかりません。");
    if (state.mode === "room" && state.direction === index) return;
    roomDirection = index;
    if (index < 4) heading = index;
    transition({ mode: "room", direction: index }, 0.85);
  }
  function inspect(index: number): void {
    if (!inspections[index]) throw new Error("掲示用紙が見つかりません。");
    if (state.mode === "notice" && state.index === index) return;
    transition({ mode: "notice", index }, 1.05);
  }
  apply(target);
  onChange(state);
  return {
    get state(): ViewState {
      return state;
    },
    get moving(): boolean {
      return elapsed < duration && !motion.matches;
    },
    select,
    inspect,
    turn(step: number) {
      select((((heading + step) % 4) + 4) % 4);
    },
    vertical(step: number) {
      if (state.mode !== "room") return;
      const level = state.direction === 4 ? 1 : state.direction === 5 ? -1 : 0;
      const next = MathUtils.clamp(level + step, -1, 1);
      select(next === 1 ? 4 : next === -1 ? 5 : heading);
    },
    next(step: number) {
      if (state.mode === "notice")
        inspect((state.index + step + inspections.length) % inspections.length);
    },
    back() {
      if (state.mode === "notice") transition({ mode: "room", direction: roomDirection }, 0.95);
    },
    resize() {
      target = pose();
      elapsed = duration;
      apply(target);
    },
    update(delta: number) {
      elapsed = motion.matches ? duration : Math.min(duration, elapsed + delta);
      const t = MathUtils.smootherstep(elapsed / duration, 0, 1);
      camera.position.lerpVectors(start.position, target.position, t);
      camera.quaternion.slerpQuaternions(start.quaternion, target.quaternion, t);
      camera.fov = MathUtils.lerp(start.fov, target.fov, t);
      camera.updateProjectionMatrix();
      return elapsed < duration;
    },
  };
}
