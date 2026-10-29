import { MathUtils } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";
import type { createInterface } from ".";
import type { Notice } from "../scene/board";
import type { createView } from "../scene/view";
import { createPicker } from "./picking";
import type { createComputerInterface } from "./computer";
import type { bindRoomSwitch } from "./room-switch";
import type { createDoorInterface } from "./door";
import { bindKeyboardTargets } from "./keyboard-targets";

export function bindRoomControls(
  root: HTMLElement,
  ui: ReturnType<typeof createInterface>,
  view: ReturnType<typeof createView>,
  camera: PerspectiveCamera,
  scene: Scene,
  notices: Map<Object3D, Notice>,
  computer: ReturnType<typeof createComputerInterface>,
  lightSwitch: ReturnType<typeof bindRoomSwitch>,
  refreshBoard: () => void,
  door: ReturnType<typeof createDoorInterface>,
) {
  const entries = [...notices];
  const papers = entries.map(([object]) => object);
  const pick = createPicker(
    ui.canvas,
    camera,
    scene,
    papers,
    computer.targets,
    lightSwitch.object,
    door.targets,
  );
  const keyboard = bindKeyboardTargets(
    root,
    ui,
    view,
    entries.map(([, notice]) => notice),
    computer,
    lightSwitch,
    refreshBoard,
  );
  function zoom(factor: number, animated: boolean): void {
    view.zoom(factor, animated);
  }
  function moveNotice(columnStep: number, rowStep: number): void {
    const state = view.state;
    if (state.mode !== "notice") return;
    const column = MathUtils.clamp(Math.floor(state.index / 2) + columnStep, 0, 1);
    const row = MathUtils.clamp((state.index % 2) + rowStep, 0, 1);
    view.inspect(column * 2 + row);
  }
  function nextNotice(step: number): void {
    if (view.state.mode !== "notice" || view.moving) return;
    const next = view.state.index + step;
    if (next >= papers.length) view.back();
    else view.inspect(Math.max(0, next));
  }
  window.addEventListener("keydown", (event) => {
    if (view.locked) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === "Escape") {
      view.back();
      ui.canvas.focus({ preventScroll: true });
      return;
    }
    if (document.activeElement !== ui.canvas && document.activeElement !== document.body) return;
    if ((event.key === "Enter" || event.key === " ") && view.state.mode !== "room") {
      event.preventDefault();
      if (view.state.mode === "notice") {
        const notice = entries[view.state.index]?.[1];
        if (!notice) throw new Error("掲示用紙のリンクが見つかりません。");
        if (notice.link) window.open(notice.link.href, "_blank", "noopener,noreferrer");
        else refreshBoard();
      }
      return;
    }
    if (view.state.mode !== "room" && ["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      zoom(event.key === "0" ? 1 / view.zoomFactor : event.key === "-" ? 0.8 : 1.25, true);
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (view.state.mode === "notice") {
      moveNotice(
        event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0,
        event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0,
      );
    } else if (view.state.mode !== "room" && view.zoomFactor > 1) {
      view.pan(
        event.key === "ArrowLeft" ? 0.12 : event.key === "ArrowRight" ? -0.12 : 0,
        event.key === "ArrowUp" ? 0.12 : event.key === "ArrowDown" ? -0.12 : 0,
      );
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (view.state.mode === "room") view.turn(event.key === "ArrowLeft" ? 1 : -1);
    } else view.vertical(event.key === "ArrowUp" ? 1 : -1);
  });
  const pointers = new Map<number, { x: number; y: number }>();
  let start: { id: number; x: number; y: number } | undefined;
  let pinchDistance = 0;
  let pinched = false;
  function distance(): number {
    const points = [...pointers.values()];
    const first = points[0];
    const second = points[1];
    return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
  }
  function cursor(clickable: boolean, dragging: boolean): void {
    ui.canvas.classList.toggle("cursor-pointer", clickable && !dragging);
    ui.canvas.classList.toggle("cursor-grab", !clickable && !dragging);
    ui.canvas.classList.toggle("cursor-grabbing", dragging);
  }
  ui.canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || view.moving || view.locked) return;
    ui.canvas.focus({ preventScroll: true });
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    ui.canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
      pinched = false;
    } else {
      start = undefined;
      pinched = true;
      pinchDistance = distance();
    }
  });
  ui.canvas.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) {
      if (event.pointerType === "mouse")
        cursor(!view.locked && !view.moving && Boolean(pick(event, false)), false);
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const nextDistance = distance();
      if (pinchDistance > 0) zoom(nextDistance / pinchDistance, false);
      pinchDistance = nextDistance;
    } else if (start && view.state.mode !== "room" && view.zoomFactor > 1 && !pinched) {
      view.pan(
        (event.clientX - previous.x) / ui.canvas.clientWidth,
        (event.clientY - previous.y) / ui.canvas.clientHeight,
      );
      cursor(false, true);
    }
  });
  ui.canvas.addEventListener("pointerup", (event) => {
    const origin = start;
    pointers.delete(event.pointerId);
    start = undefined;
    if (ui.canvas.hasPointerCapture(event.pointerId))
      ui.canvas.releasePointerCapture(event.pointerId);
    cursor(false, false);
    if (!origin || origin.id !== event.pointerId || pinched || pointers.size > 0) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    const threshold = Math.min(72, Math.max(36, ui.canvas.clientWidth * 0.1));
    if (view.state.mode !== "room" && view.zoomFactor > 1) {
      if (Math.hypot(dx, dy) >= 10) return;
    } else if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (view.state.mode === "notice") nextNotice(dx < 0 ? 1 : -1);
      else if (view.state.mode === "room") view.turn(dx > 0 ? 1 : -1);
      return;
    } else if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx) * 1.25) {
      if (view.state.mode === "notice") nextNotice(dy < 0 ? 1 : -1);
      else view.vertical(dy > 0 ? 1 : -1);
      return;
    }
    if (Math.hypot(dx, dy) >= 10 || view.moving || view.locked) return;
    const hit = pick(event, true);
    if (!hit) {
      view.back();
      return;
    }
    if (hit.type === "door") {
      door.toggle();
      return;
    }
    if (hit.type === "door-light") {
      door.enter();
      return;
    }
    if (hit.type === "computer") {
      view.inspectComputer();
      return;
    }
    if (hit.type === "power") {
      keyboard.togglePower();
      return;
    }
    if (hit.type === "light") {
      keyboard.toggleLight();
      return;
    }
    const notice = entries[hit.index]?.[1];
    if (!notice) throw new Error("掲示用紙のリンクが見つかりません。");
    if (view.state.mode === "notice" && view.state.index === hit.index) {
      if (notice.link) window.open(notice.link.href, "_blank", "noopener,noreferrer");
      else refreshBoard();
    } else view.inspect(hit.index);
  });
  const cancel = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (start?.id === event.pointerId) start = undefined;
    pinchDistance = 0;
    cursor(false, false);
  };
  ui.canvas.addEventListener("pointercancel", cancel);
  ui.canvas.addEventListener("lostpointercapture", cancel);
  let wheelDistance = 0;
  let lastWheelTime = 0;
  let lastNoticeTime = -Infinity;
  ui.canvas.addEventListener(
    "wheel",
    (event) => {
      if (view.locked || view.state.mode === "room") return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 540 : 1;
      if (view.state.mode === "notice" && !event.ctrlKey) {
        const now = performance.now();
        if (view.moving || now - lastNoticeTime < 600) return;
        if (now - lastWheelTime > 160) wheelDistance = 0;
        lastWheelTime = now;
        wheelDistance += event.deltaY * unit;
        if (Math.abs(wheelDistance) >= 36) {
          nextNotice(Math.sign(wheelDistance));
          lastNoticeTime = now;
          wheelDistance = 0;
        }
        return;
      }
      zoom(Math.exp(-MathUtils.clamp(event.deltaY * unit, -200, 200) * 0.003), true);
    },
    { passive: false },
  );
  return keyboard;
}
