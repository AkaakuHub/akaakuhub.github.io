import { MathUtils, Quaternion, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import { createMotionOffset } from "./motion";
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
  computer: InspectionTarget & { screen: InspectionTarget },
  onChange: (state: ViewState, zoom: number) => void,
  invalidate: () => void,
  getViewport: () => InspectionViewport,
) {
  if (inspections.length === 0) throw new Error("掲示用紙が配置されていません。");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let deviceMotion = createMotionOffset();
  const position = camera.position.clone();
  const quaternion = camera.quaternion.clone();
  let locked = false;
  let state: ViewState = { mode: "notice", index: 0 };
  let roomDirection: RoomDirection = 0;
  let heading = 0;
  const framing: InspectionFraming = { zoom: 1, panX: 0, panY: 0 };
  let start: CameraPose = { position: new Vector3(), quaternion: new Quaternion(), fov: 62 };
  let target: CameraPose;
  let elapsed = 1;
  let duration = 1;

  function inspectionTarget(): InspectionTarget {
    if (state.mode === "computer") return computer;
    if (state.mode === "screen") return computer.screen;
    if (state.mode !== "notice") throw new Error("拡大する対象がありません。");
    const inspection = inspections[state.index];
    if (!inspection) throw new Error("掲示用紙の視点が見つかりません。");
    return inspection;
  }
  function pose(): CameraPose {
    if (state.mode === "room") return roomPose(state.direction, heading, camera.aspect);
    const inspection = inspectionTarget();
    if (!inspection) throw new Error("掲示用紙の視点が見つかりません。");
    const viewport = getViewport();
    const bounds = inspectionBounds(inspection, viewport, framing.zoom);
    framing.panX = MathUtils.clamp(framing.panX, -bounds.maxX, bounds.maxX);
    framing.panY = MathUtils.clamp(framing.panY, -bounds.maxY, bounds.maxY);
    return inspectionPose(inspection, viewport, framing);
  }
  function apply(result: CameraPose): void {
    position.copy(result.position);
    quaternion.copy(result.quaternion);
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
      position: position.clone(),
      quaternion: quaternion.clone(),
      fov: camera.fov,
    };
    target = pose();
    elapsed = 0;
    duration = seconds;
    if (seconds === 0) apply(target);
    invalidate();
  }
  function select(index: number): void {
    if (locked) return;
    if (!isRoomDirection(index)) throw new Error("部屋の向きが見つかりません。");
    if (state.mode === "room" && state.direction === index) return;
    roomDirection = index;
    if (index < 4) heading = index;
    transition({ mode: "room", direction: index }, 0.6);
  }
  function inspect(index: number): void {
    if (locked) return;
    if (!inspections[index]) throw new Error("掲示用紙が見つかりません。");
    if (state.mode === "notice" && state.index === index) return;
    framing.zoom = 1;
    framing.panX = 0;
    framing.panY = 0;
    transition({ mode: "notice", index }, 0.36);
  }
  target = pose();
  apply(target);
  onChange(state, framing.zoom);
  return {
    get locked(): boolean {
      return locked;
    },
    lock(): void {
      locked = true;
    },
    unlock(): void {
      locked = false;
    },
    respawn(): void {
      locked = false;
      roomDirection = 0;
      heading = 0;
      framing.zoom = 1;
      framing.panX = 0;
      framing.panY = 0;
      deviceMotion = createMotionOffset();
      transition({ mode: "notice", index: 0 }, 0);
    },
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
    setMotion(x: number, y: number): void {
      if (locked) return;
      if (deviceMotion.setTarget(x, y)) invalidate();
    },
    inspectScreen(): void {
      if (locked || state.mode === "screen") return;
      framing.zoom = 1;
      framing.panX = 0;
      framing.panY = 0;
      transition({ mode: "screen" }, 0.36);
    },
    inspectComputer() {
      if (locked) return;
      if (state.mode === "computer") return;
      if (state.mode === "room") framing.zoom = 1;
      framing.panX = 0;
      framing.panY = 0;
      transition({ mode: "computer" }, 0.36);
    },
    zoom(factor: number, animated: boolean) {
      if (locked) return;
      if (state.mode === "room") return;
      const zoom = MathUtils.clamp(framing.zoom * factor, 1, 2.8);
      if (zoom === framing.zoom) return;
      framing.zoom = zoom;
      move(animated ? 0.2 : 0.08);
    },
    pan(dx: number, dy: number) {
      if (locked) return;
      if (state.mode === "room" || framing.zoom === 1) return;
      const inspection = inspectionTarget();
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
      if (locked) return;
      if (state.mode !== "room") transition({ mode: "room", direction: roomDirection }, 0.32);
    },
    resize() {
      if (locked) return;
      if (elapsed < duration) {
        move(duration - elapsed);
        return;
      }
      target = pose();
      apply(target);
    },
    update(delta: number) {
      if (locked) return false;
      if (elapsed < duration) {
        elapsed = motion.matches ? duration : Math.min(duration, elapsed + Math.min(delta, 1 / 30));
        const t = duration === 0 ? 1 : MathUtils.smootherstep(elapsed / duration, 0, 1);
        position.lerpVectors(start.position, target.position, t);
        quaternion.slerpQuaternions(start.quaternion, target.quaternion, t);
        const fov = MathUtils.lerp(start.fov, target.fov, t);
        if (camera.fov !== fov) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      }
      camera.position.copy(position);
      camera.quaternion.copy(quaternion);
      const moving = deviceMotion.apply(camera, delta);
      return elapsed < duration || moving;
    },
  };
}
