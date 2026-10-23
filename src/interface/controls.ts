import { Mesh, Raycaster, Vector2 } from "three";
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
  root.querySelector(".turn-left")?.addEventListener("click", () => view.turn(1));
  root.querySelector(".turn-right")?.addEventListener("click", () => view.turn(-1));
  root.querySelectorAll<HTMLButtonElement>(".direction").forEach((button) => {
    button.addEventListener("click", () => view.select(Number(button.dataset.direction)));
  });
  root.querySelector(".board-action")?.addEventListener("click", () => view.inspect(0));
  root.querySelector(".inspection-back")?.addEventListener("click", () => view.back());
  root.querySelector(".previous-notice")?.addEventListener("click", () => view.next(-1));
  root.querySelector(".next-notice")?.addEventListener("click", () => view.next(1));
  root.querySelector(".inspection-link")?.addEventListener("click", (event) => {
    if (view.moving) event.preventDefault();
  });
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === "Escape") view.back();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (view.state.mode === "notice") view.next(event.key === "ArrowRight" ? 1 : -1);
      else view.turn(event.key === "ArrowLeft" ? 1 : -1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      view.vertical(event.key === "ArrowUp" ? 1 : -1);
    }
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
  let start: { id: number; x: number; y: number } | undefined;
  ui.canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) {
      start = undefined;
      return;
    }
    if (event.button !== 0) return;
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    ui.canvas.setPointerCapture(event.pointerId);
  });
  ui.canvas.addEventListener("pointerup", (event) => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = undefined;
    if (ui.canvas.hasPointerCapture(event.pointerId))
      ui.canvas.releasePointerCapture(event.pointerId);
    const threshold = Math.min(72, Math.max(36, ui.canvas.clientWidth * 0.1));
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (view.state.mode === "notice") view.next(dx < 0 ? 1 : -1);
      else view.turn(dx > 0 ? 1 : -1);
    } else if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx) * 1.25) {
      view.vertical(dy > 0 ? 1 : -1);
    } else if (Math.hypot(dx, dy) < 10 && !view.moving) {
      const hit = pick(event);
      if (!hit) return;
      if (view.state.mode === "notice" && view.state.index === hit.index) {
        if (hit.uv && hit.uv.y < 0.24 && hit.uv.y > 0.04)
          window.open(hit.notice.link.href, "_blank", "noopener,noreferrer");
      } else view.inspect(hit.index);
    }
  });
  const cancel = () => {
    start = undefined;
  };
  ui.canvas.addEventListener("pointercancel", cancel);
  ui.canvas.addEventListener("lostpointercapture", cancel);
  ui.canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    ui.canvas.style.cursor = !view.moving && pick(event) ? "pointer" : "grab";
  });
}
