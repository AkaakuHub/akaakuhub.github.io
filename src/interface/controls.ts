import { MathUtils, Mesh, Raycaster, Vector2 } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";
import type { createInterface } from ".";
import type { Notice } from "../scene/board";
import type { createView } from "../scene/view";

export function bindRoomControls(
  root: HTMLElement,
  ui: ReturnType<typeof createInterface>,
  view: ReturnType<typeof createView>,
  camera: PerspectiveCamera,
  scene: Scene,
  notices: Map<Object3D, Notice>,
): void {
  const entries = [...notices];
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  root.querySelectorAll<HTMLButtonElement>(".direction").forEach((button) => {
    button.addEventListener("click", () => view.select(Number(button.dataset.direction)));
  });
  root.querySelector(".board-action")?.addEventListener("click", () => view.inspect(0));
  function zoom(factor: number, animated: boolean): void {
    view.zoom(factor, animated);
    ui.setZoom(view.zoomFactor);
  }
  root.querySelector(".zoom-notice")?.addEventListener("click", () => {
    zoom(view.zoomFactor > 1 ? 1 / view.zoomFactor : 2.2, true);
  });
  root.querySelector(".inspection-back")?.addEventListener("click", () => view.back());
  root.querySelector(".previous-notice")?.addEventListener("click", () => view.next(-1));
  root.querySelector(".next-notice")?.addEventListener("click", () => view.next(1));
  root.querySelector(".inspection-link")?.addEventListener("click", (event) => {
    if (view.moving) event.preventDefault();
  });
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === "Escape") {
      if (view.state.mode === "notice" && view.zoomFactor > 1) zoom(1 / view.zoomFactor, true);
      else view.back();
    }
    if (view.state.mode === "notice" && ["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      zoom(event.key === "0" ? 1 / view.zoomFactor : event.key === "-" ? 0.8 : 1.25, true);
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (view.state.mode === "notice" && view.zoomFactor > 1) {
      view.pan(
        event.key === "ArrowLeft" ? 0.12 : event.key === "ArrowRight" ? -0.12 : 0,
        event.key === "ArrowUp" ? 0.12 : event.key === "ArrowDown" ? -0.12 : 0,
      );
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (view.state.mode === "notice") view.next(event.key === "ArrowRight" ? 1 : -1);
      else view.turn(event.key === "ArrowLeft" ? 1 : -1);
    } else view.vertical(event.key === "ArrowUp" ? 1 : -1);
  });
  function pick(event: PointerEvent) {
    const rect = ui.canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find(({ object }) => object instanceof Mesh);
    if (!hit) return undefined;
    const index = entries.findIndex(([object]) => object === hit.object);
    const entry = entries[index];
    return entry ? { index, notice: entry[1], uv: hit.uv } : undefined;
  }
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
    if (event.button !== 0 || view.moving) return;
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
      if (event.pointerType === "mouse") cursor(!view.moving && Boolean(pick(event)), false);
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const nextDistance = distance();
      if (pinchDistance > 0) zoom(nextDistance / pinchDistance, false);
      pinchDistance = nextDistance;
    } else if (start && view.state.mode === "notice" && view.zoomFactor > 1 && !pinched) {
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
    if (view.state.mode === "notice" && view.zoomFactor > 1) {
      if (Math.hypot(dx, dy) >= 10) return;
    } else if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (view.state.mode === "notice") view.next(dx < 0 ? 1 : -1);
      else view.turn(dx > 0 ? 1 : -1);
      return;
    } else if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx) * 1.25) {
      view.vertical(dy > 0 ? 1 : -1);
      return;
    }
    if (Math.hypot(dx, dy) >= 10 || view.moving) return;
    const hit = pick(event);
    if (!hit) return;
    if (view.state.mode === "notice" && view.state.index === hit.index) {
      if (hit.uv && hit.uv.y < 0.24 && hit.uv.y > 0.04)
        window.open(hit.notice.link.href, "_blank", "noopener,noreferrer");
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
  ui.canvas.addEventListener(
    "wheel",
    (event) => {
      if (view.state.mode !== "notice") return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? ui.canvas.clientHeight : 1;
      zoom(Math.exp(-MathUtils.clamp(event.deltaY * unit, -200, 200) * 0.003), true);
    },
    { passive: false },
  );
}
