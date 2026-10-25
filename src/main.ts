import "./tailwind.css";
import { Color, PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { createInterface } from "./interface";
import type { Loading } from "./interface/loading";
import { bindRoomSwitch } from "./interface/room-switch";
import { bindRoomControls } from "./interface/controls";
import { assembleClubroom } from "./scene/clubroom";
import { illuminate } from "./scene/lighting";
import { createRoomAssetLoader } from "./assets/loading";
import { loadMaterials } from "./scene/materials/library";
import { createRendering } from "./scene/rendering";
import { createView } from "./scene/view";
import { observeViewport } from "./scene/viewport";
import { loadTokyoWeather, observeTokyoWeather } from "./weather/client";
import { weatherAt } from "./weather/schema";
import { createFrameMetrics } from "./scene/frame-metrics";
import { loadAreaLightTables } from "./scene/lighting/area-tables";
import { bindRenderingErrors } from "./scene/rendering/errors";
import { createBoardLoader } from "./scene/board/loading";
import { prepareBoardFont } from "./assets/typography";
import { createContributionDisplay } from "./scene/board/contribution-display";

export async function startRoom(root: HTMLElement, loading: Loading) {
  const ui = createInterface(root);
  const weatherReady = loadTokyoWeather();
  const fontsReady = prepareBoardFont("");
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
  const renderer = new WebGLRenderer({ canvas: ui.canvas, antialias: false });
  bindRenderingErrors(renderer, ui.canvas, loading.fail);
  const frameMetrics = import.meta.env.DEV ? createFrameMetrics(renderer) : undefined;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.position.set(0, 1.55, 0.45);
  const assets = createRoomAssetLoader((summary) => {
    loading.progress(summary.succeeded, summary.total);
  });
  const materialLoading = loadMaterials(renderer, assets);
  const lightTablesReady = loadAreaLightTables(renderer, assets);
  const { materials } = materialLoading;
  const [initialWeather] = await Promise.all([
    weatherReady,
    materialLoading.paperReady,
    fontsReady,
  ]);
  loading.stage("室内の形を組み立てています");
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  const { board, lightSwitch, rocker, computer } = assembleClubroom(scene, materials);
  const weatherStatus = board.weather;
  loading.stage("部室の明かりを整えています");
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  await Promise.all([materialLoading.ready, lightTablesReady]);
  const lighting = illuminate(scene, renderer, weatherAt(initialWeather, Date.now()));
  const weather = observeTokyoWeather(
    initialWeather,
    (current) => {
      weatherStatus.loaded();
      const sample = weatherAt(current, Date.now());
      weatherStatus.update(sample, new Date());
      lighting.update(new Date(), sample, prepared && !view.moving);
      if (scene.background instanceof Color) rendering.weather.update(sample, scene.background);
      invalidate();
    },
    (error) => {
      weatherStatus.fail();
      loading.fail(error);
      invalidate();
    },
  );
  const container = ui.canvas.parentElement;
  if (!container) throw new Error("部屋の表示領域が見つかりません。");
  const contributions = createContributionDisplay(container, board.profilePaper, camera);
  const rendering = createRendering(
    renderer,
    scene,
    camera,
    lighting.celestialLight,
    contributions,
  );
  const noticeList = [...board.notices.values()];
  const inspections = [...board.notices].map(([object, notice]) => ({
    object,
    width: notice.size[0],
    height: notice.size[1],
    depth: 0,
  }));
  const view = createView(
    camera,
    inspections,
    computer,
    (state, zoom) => {
      contributions.setView(state);
      ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
      ui.setZoom(zoom);
      ui.setMoving(true);
    },
    invalidate,
    () => ui.inspectionViewport(),
  );
  const boardLoader = createBoardLoader(
    (state) => {
      board.setState(state);
      if (view.state.mode === "notice") ui.setView(view.state, noticeList[view.state.index]);
      invalidate();
    },
    (state) => {
      contributions.setState(state);
      invalidate();
    },
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
    lighting.update(new Date(), sample, prepared && !view.moving);
    if (scene.background instanceof Color) rendering.weather.update(sample, scene.background);
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
    if (document.hidden || !prepared) return;
    const frameDuration = compact.matches ? 1000 / 30 : 1000 / 60;
    if (time - lastRendered < frameDuration - 0.5) {
      frame = requestAnimationFrame(render);
      return;
    }
    const moving = view.update((time - previous) / 1000);
    ui.setMoving(moving);
    previous = time;
    lastRendered = time;
    roomSwitch.update(view.state.mode === "room" && !view.moving);
    frameMetrics?.begin(moving);
    rendering.render(moving);
    frameMetrics?.end(moving);
    if (!ready) {
      loading.complete();
      if (import.meta.env.DEV) console.info("部室の初回描画が完了しました。");
      ready = true;
    }
    if (moving || rendering.weather.active) frame = requestAnimationFrame(render);
  }
  function invalidate() {
    rendering.invalidate();
    requestFrame();
  }
  function requestFrame() {
    if (frame || document.hidden) return;
    previous = performance.now() - 16;
    frame = requestAnimationFrame(render);
  }
  updateTime();
  loading.rendering(0, 2);
  await renderer.compileAsync(scene, camera);
  loading.rendering(1, 2);
  lighting.update(new Date(), weatherAt(weather.current, Date.now()));
  await renderer.compileAsync(scene, camera);
  loading.rendering(2, 2);
  rendering.render();
  bindRoomControls(
    root,
    ui,
    view,
    camera,
    scene,
    board.notices,
    computer.object,
    () => void boardLoader.refresh(true),
  );
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
  requestFrame();
  void boardLoader.refresh(false);
}
