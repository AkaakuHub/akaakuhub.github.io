import { MathUtils, Quaternion, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import { inspectionBounds, inspectionPose, isRoomDirection, roomPose } from "./targets";
import type {
  CameraPose,
  InspectionFraming,
  InspectionTarget,
  InspectionViewport,
  RoomDirection,
  ViewState,
} from "./targets";

export type { ViewState } from "./targets";

export function createView(
  camera: PerspectiveCamera,
  inspections: readonly InspectionTarget[],
  computer: InspectionTarget,
  onChange: (state: ViewState, zoom: number) => void,
  invalidate: () => void,
  getViewport: () => InspectionViewport,
) {
  if (inspections.length === 0) throw new Error("掲示用紙が配置されていません。");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state: ViewState = { mode: "room", direction: 0 };
  let roomDirection: RoomDirection = 0;
  let heading = 0;
  const framing: InspectionFraming = { zoom: 1, panX: 0, panY: 0 };
  let start: CameraPose = { position: new Vector3(), quaternion: new Quaternion(), fov: 62 };
  let target = roomPose(0, heading, camera.aspect);
  let elapsed = 1;
  let duration = 1;

  function pose(): CameraPose {
    if (state.mode === "room") return roomPose(state.direction, heading, camera.aspect);
    const inspection = state.mode === "computer" ? computer : inspections[state.index];
    if (!inspection) throw new Error("掲示用紙の視点が見つかりません。");
    const viewport = getViewport();
    const bounds = inspectionBounds(inspection, viewport, framing.zoom);
    framing.panX = MathUtils.clamp(framing.panX, -bounds.maxX, bounds.maxX);
    framing.panY = MathUtils.clamp(framing.panY, -bounds.maxY, bounds.maxY);
    return inspectionPose(inspection, viewport, framing);
  }
  function apply(result: CameraPose): void {
    camera.position.copy(result.position);
    camera.quaternion.copy(result.quaternion);
    camera.fov = result.fov;
    camera.updateProjectionMatrix();
  }
  function transition(next: ViewState, seconds: number): void {
    state = next;
    onChange(state, framing.zoom);
    move(seconds);
  }
  function move(seconds: number): void {
    start = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      fov: camera.fov,
    };
    target = pose();
    elapsed = 0;
    duration = seconds;
    if (seconds === 0) apply(target);
    invalidate();
  }
  function select(index: number): void {
    if (!isRoomDirection(index)) throw new Error("部屋の向きが見つかりません。");
    if (state.mode === "room" && state.direction === index) return;
    roomDirection = index;
    if (index < 4) heading = index;
    transition({ mode: "room", direction: index }, 0.32);
  }
  function inspect(index: number): void {
    if (!inspections[index]) throw new Error("掲示用紙が見つかりません。");
    if (state.mode === "notice" && state.index === index) return;
    if (state.mode === "room") framing.zoom = 1;
    framing.panX = 0;
    framing.panY = 0;
    transition({ mode: "notice", index }, 0.36);
  }
  apply(target);
  onChange(state, framing.zoom);
  return {
    get state(): ViewState {
      return state;
    },
    get moving(): boolean {
      return elapsed < duration && !motion.matches;
    },
    get zoomFactor(): number {
      return framing.zoom;
    },
    select,
    inspect,
    inspectComputer() {
      if (state.mode === "computer") return;
      if (state.mode === "room") framing.zoom = 1;
      framing.panX = 0;
      framing.panY = 0;
      transition({ mode: "computer" }, 0.36);
    },
    zoom(factor: number, animated: boolean) {
      if (state.mode === "room") return;
      const zoom = MathUtils.clamp(framing.zoom * factor, 1, 2.8);
      if (zoom === framing.zoom) return;
      framing.zoom = zoom;
      move(animated ? 0.2 : 0.08);
    },
    pan(dx: number, dy: number) {
      if (state.mode === "room" || framing.zoom === 1) return;
      const inspection = state.mode === "computer" ? computer : inspections[state.index];
      if (!inspection) throw new Error("掲示用紙の視点が見つかりません。");
      const bounds = inspectionBounds(inspection, getViewport(), framing.zoom);
      framing.panX -= dx * bounds.visibleWidth;
      framing.panY += dy * bounds.visibleHeight;
      move(0.08);
    },
    turn(step: number) {
      select((((heading + step) % 4) + 4) % 4);
    },
    vertical(step: number) {
      if (state.mode !== "room") return;
      if (step > 0) select(4);
      else if (step < 0 && state.direction === 4) select(heading);
    },
    back() {
      if (state.mode !== "room") transition({ mode: "room", direction: roomDirection }, 0.32);
    },
    resize() {
      target = pose();
      elapsed = duration;
      apply(target);
    },
    update(delta: number) {
      if (elapsed >= duration) return false;
      elapsed = motion.matches ? duration : Math.min(duration, elapsed + delta);
      const t = duration === 0 ? 1 : MathUtils.smootherstep(elapsed / duration, 0, 1);
      camera.position.lerpVectors(start.position, target.position, t);
      camera.quaternion.slerpQuaternions(start.quaternion, target.quaternion, t);
      const fov = MathUtils.lerp(start.fov, target.fov, t);
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      return elapsed < duration;
    },
  };
}
