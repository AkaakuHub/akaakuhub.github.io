import {
  ACESFilmicToneMapping,
  Color,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { createInterface } from "./interface";
import { createBoard } from "./scene/board";
import { createFurniture } from "./scene/furniture";
import { illuminate } from "./scene/lighting";
import { createRendering } from "./scene/rendering";
import { createRoom } from "./scene/room";
import { createView } from "./scene/view";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const ui = createInterface(root);
const renderer = new WebGLRenderer({
  canvas: ui.canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
const scene = new Scene();
scene.background = new Color("#d7dcd8");
const camera = new PerspectiveCamera(58, 1, 0.05, 40);
camera.position.set(0, 1.55, 0.45);
const board = createBoard();
scene.add(createRoom(), createFurniture(), board.group);
illuminate(scene, renderer);
const rendering = createRendering(renderer, scene, camera);
const view = createView(camera, (index) => {
  ui.setDirection(index);
  invalidate();
});
let frame = 0;
let previous = performance.now();
const raycaster = new Raycaster();
const pointer = new Vector2();
const papers = [...board.notices.keys()];
const notices = [...board.notices.values()];

root.querySelector(".turn-left")?.addEventListener("click", () => view.turn(1));
root.querySelector(".turn-right")?.addEventListener("click", () => view.turn(-1));
root.querySelectorAll<HTMLButtonElement>(".direction").forEach((button) => {
  button.addEventListener("click", () => view.select(Number(button.dataset.direction)));
});
root.querySelector(".board-action")?.addEventListener("click", () => ui.showBoard(notices));
window.addEventListener("keydown", (event) => {
  if (ui.dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    view.turn(event.key === "ArrowLeft" ? 1 : -1);
  }
});
function pick(event: PointerEvent) {
  const rect = ui.canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(papers, false)[0];
}
let pointerStart: { x: number; y: number } | undefined;
ui.canvas.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
  ui.canvas.setPointerCapture(event.pointerId);
});
ui.canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = undefined;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) view.turn(dx > 0 ? 1 : -1);
  else if (Math.hypot(dx, dy) < 10) {
    const hit = pick(event);
    const notice = hit ? board.notices.get(hit.object) : undefined;
    if (notice) ui.showNotice(notice);
  }
});
ui.canvas.addEventListener("pointercancel", () => {
  pointerStart = undefined;
});
ui.canvas.addEventListener("pointermove", (event) => {
  ui.canvas.style.cursor = pick(event) ? "pointer" : "grab";
});
function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.fov = Math.max(
    58,
    (2 * Math.atan(Math.tan((34 * Math.PI) / 180) / camera.aspect) * 180) / Math.PI,
  );
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  rendering.setSize(width, height);
  invalidate();
}
window.addEventListener("resize", resize);
resize();
function render(time: number) {
  frame = 0;
  const moving = view.update(Math.min((time - previous) / 1000, 0.05));
  previous = time;
  rendering.render();
  if (moving) frame = requestAnimationFrame(render);
}
function invalidate() {
  if (frame) return;
  previous = performance.now() - 16;
  frame = requestAnimationFrame(render);
}
ui.ready();
