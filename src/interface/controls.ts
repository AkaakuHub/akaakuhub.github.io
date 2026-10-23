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
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  root.querySelector(".turn-left")?.addEventListener("click", () => view.turn(1));
  root.querySelector(".turn-right")?.addEventListener("click", () => view.turn(-1));
  root.querySelectorAll<HTMLButtonElement>(".direction").forEach((button) => {
    button.addEventListener("click", () => view.select(Number(button.dataset.direction)));
  });
  root
    .querySelector(".board-action")
    ?.addEventListener("click", () => ui.showBoard([...notices.values()]));
  window.addEventListener("keydown", (event) => {
    if (ui.dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      view.turn(event.key === "ArrowLeft" ? 1 : -1);
    }
  });
  function pick(event: PointerEvent): Notice | undefined {
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
    return hit ? notices.get(hit.object) : undefined;
  }
  let start: { id: number; x: number; y: number } | undefined;
  ui.canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) {
      start = undefined;
      return;
    }
    if (event.button !== 0 || ui.dialog.open) return;
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
    if (ui.dialog.open) return;
    const threshold = Math.min(72, Math.max(36, ui.canvas.clientWidth * 0.1));
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.25) view.turn(dx > 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 10) {
      const notice = pick(event);
      if (notice) ui.showNotice(notice);
    }
  });
  const cancel = () => {
    start = undefined;
  };
  ui.canvas.addEventListener("pointercancel", cancel);
  ui.canvas.addEventListener("lostpointercapture", cancel);
  ui.canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    ui.canvas.style.cursor = pick(event) ? "pointer" : "grab";
  });
}
