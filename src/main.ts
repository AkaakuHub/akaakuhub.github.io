import { PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { createInterface } from "./interface";
import { createLoading } from "./interface/loading";
import { bindRoomSwitch } from "./interface/room-switch";
import { bindRoomControls } from "./interface/controls";
import { assembleClubroom } from "./scene/clubroom";
import { illuminate } from "./scene/lighting";
import { createRoomAssetLoader } from "./assets/loading";
import { streamMaterials } from "./scene/materials/stream";
import { loadMaterials } from "./scene/materials/library";
import { createRendering } from "./scene/rendering";
import { createView } from "./scene/view";
import { observeViewport } from "./scene/viewport";
import { loadTokyoWeather, observeTokyoWeather } from "./weather/client";
import { createWeatherStatus } from "./interface/weather";
import { weatherAt } from "./weather/schema";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const ui = createInterface(root);
const loading = createLoading(root);
const weatherStatus = createWeatherStatus(root);
const weatherReady = loadTokyoWeather();
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
const assets = createRoomAssetLoader((summary) => {
  const failure = summary.failures[0];
  if (failure) loading.fail(failure.reason);
  else loading.progress("素材を準備中", summary.succeeded, summary.total);
});
const materialLoading = loadMaterials(renderer, assets);
const { materials } = materialLoading;
const [initialWeather] = await Promise.all([weatherReady, materialLoading.paperReady]);
loading.stage("部屋を組み立て中");
await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const { board, lightSwitch, rocker } = assembleClubroom(scene, materials);
loading.stage("描画を準備中");
await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const lighting = illuminate(scene, renderer, weatherAt(initialWeather, Date.now()));
const weather = observeTokyoWeather(
  initialWeather,
  (current) => {
    weatherStatus.loaded();
    const sample = weatherAt(current, Date.now());
    weatherStatus.update(sample, new Date());
    lighting.update(new Date(), sample, prepared);
    invalidate();
  },
  weatherStatus.fail,
);
const rendering = createRendering(renderer, scene, camera, lighting.celestialLight);
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
let prepared = false;
const compact = window.matchMedia("(pointer: coarse)");

observeViewport(ui.canvas, camera, renderer, rendering, () => {
  view.resize();
  invalidate();
});

function updateTime() {
  if (document.hidden) return;
  if (Date.now() >= weather.current.expiresAt) {
    void weather.refresh();
    return;
  }
  const sample = weatherAt(weather.current, Date.now());
  weatherStatus.update(sample, new Date());
  lighting.update(new Date(), sample, prepared);
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
  const moving = view.update((time - previous) / 1000);
  ui.setMoving(moving);
  previous = time;
  lastRendered = time;
  if (prepared) roomSwitch.update(view.state.mode === "room" && !view.moving);
  rendering.render(moving || !prepared);
  if (!ready && prepared) {
    loading.complete();
    ready = true;
  }
  if (moving) frame = requestAnimationFrame(render);
}
function invalidate() {
  if (frame || document.hidden) return;
  previous = performance.now() - 16;
  frame = requestAnimationFrame(render);
}
const streamed = streamMaterials(
  scene,
  materialLoading.pending,
  renderer,
  camera,
  (completed, total) => {
    loading.rendering(completed, total);
    invalidate();
  },
);
updateTime();
await new Promise<void>((resolve) =>
  requestAnimationFrame(() => {
    rendering.render(true);
    resolve();
  }),
);
await Promise.all([materialLoading.ready, streamed]);
lighting.update(new Date(), weatherAt(weather.current, Date.now()));
await renderer.compileAsync(scene, camera);
rendering.render(true);
rendering.render();
bindRoomControls(root, ui, view, camera, scene, board.notices);
const roomSwitch = bindRoomSwitch(
  root,
  lightSwitch,
  rocker,
  camera,
  lighting.setRoomLights,
  invalidate,
);
roomSwitch.update();
prepared = true;
invalidate();
