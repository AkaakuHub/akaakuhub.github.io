import { PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { createInterface } from "./interface";
import { bindRoomControls } from "./interface/controls";
import { createBoard } from "./scene/board";
import { createFurniture } from "./scene/furniture";
import { illuminate } from "./scene/lighting";
import { loadBakedLighting } from "./scene/lighting/baked";
import { loadMaterials } from "./scene/materials/library";
import { createMetalMaterials } from "./scene/materials/metal";
import { createPropMaterials } from "./scene/materials/props";
import { createRendering } from "./scene/rendering";
import { createRoom } from "./scene/room";
import { batchStaticMeshes } from "./scene/static-batches";
import { createView } from "./scene/view";
import { observeViewport } from "./scene/viewport";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const ui = createInterface(root);
await new Promise<void>((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
});
const renderer = new WebGLRenderer({ canvas: ui.canvas, antialias: false });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
const scene = new Scene();
const camera = new PerspectiveCamera(62, 1, 0.05, 40);
camera.position.set(0, 1.55, 0.45);
const materials = await loadMaterials(renderer);
const metals = createMetalMaterials(materials);
const props = createPropMaterials(materials);
const board = createBoard(metals, materials.paper, props);
scene.add(
  createRoom(materials, metals, props),
  createFurniture(materials, metals, props),
  board.group,
);
batchStaticMeshes(scene, new Set(board.notices.keys()));
await loadBakedLighting(scene);
const lighting = illuminate(scene, renderer);
const rendering = createRendering(renderer, scene, camera, lighting.sun);
const noticeList = [...board.notices.values()];
const inspections = [...board.notices].map(([object, notice]) => ({
  object,
  width: notice.size[0],
  height: notice.size[1],
}));
const view = createView(
  camera,
  inspections,
  (state) => {
    ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
    ui.setMoving(true);
  },
  invalidate,
  () => ui.inspectionViewport(),
);
let frame = 0;
let previous = performance.now();
let lastRendered = 0;
let ready = false;
const compact = window.matchMedia("(pointer: coarse)");

bindRoomControls(root, ui, view, camera, scene, board.notices);
observeViewport(ui.canvas, camera, renderer, rendering, () => {
  view.resize();
  invalidate();
});

function updateTime() {
  if (document.hidden) return;
  lighting.update(new Date());
  renderer.shadowMap.needsUpdate = true;
  invalidate();
}
setInterval(updateTime, 60_000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else updateTime();
});
window.addEventListener("pageshow", updateTime);

function render(time: number) {
  frame = 0;
  if (document.hidden) return;
  const frameDuration = compact.matches ? 1000 / 30 : 1000 / 60;
  if (time - lastRendered < frameDuration - 0.5) {
    frame = requestAnimationFrame(render);
    return;
  }
  const moving = view.update(Math.min((time - previous) / 1000, 0.05));
  ui.setMoving(moving);
  previous = time;
  lastRendered = time;
  rendering.render();
  if (!ready) {
    ui.ready();
    ready = true;
  }
  if (moving) frame = requestAnimationFrame(render);
}
function invalidate() {
  if (frame || document.hidden) return;
  previous = performance.now() - 16;
  frame = requestAnimationFrame(render);
}
updateTime();
