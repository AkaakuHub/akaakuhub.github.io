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
import { createComputerInterface } from "./interface/computer";

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
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  const { board, lightSwitch, rocker, computer } = assembleClubroom(scene, materials);
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  await Promise.all([materialLoading.ready, lightTablesReady]);
  const lighting = illuminate(scene, renderer, weatherAt(initialWeather, Date.now()));
  const weather = observeTokyoWeather(
    initialWeather,
    (current) => {
      const sample = weatherAt(current, Date.now());
      lighting.update(new Date(), sample, prepared && !view.moving);
      if (scene.background instanceof Color) rendering.weather.update(sample, scene.background);
      invalidate();
    },
    (error) => {
      loading.fail(error);
      invalidate();
    },
  );
  const rendering = createRendering(renderer, scene, camera, lighting.celestialLight);
  const contributions = createContributionDisplay(board.profilePaper, invalidate);
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
    { object: computer.monitor, width: 0.589, height: 0.331, depth: 0.001 },
    (state, zoom) => {
      ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
      ui.setZoom(zoom);
      ui.setMoving(true);
    },
    invalidate,
    () => ui.inspectionViewport(),
  );
  const computerInterface = createComputerInterface(computer, view, invalidate);
  const roomSwitch = bindRoomSwitch(lightSwitch, rocker, lighting.setRoomLights, invalidate);
  const boardLoader = createBoardLoader((state) => {
    board.setState(state);
    computerInterface.setState(state);
    if (view.state.mode === "notice") ui.setView(view.state, noticeList[view.state.index]);
    invalidate();
  });
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
    if (!moving) computerInterface.update();
    frameMetrics?.begin(moving);
    const animation = contributions.update(camera, time);
    if (animation.changed) rendering.invalidate();
    rendering.render(moving);
    frameMetrics?.end(moving);
    if (!ready) {
      loading.complete();
      if (import.meta.env.DEV) console.info("部室の初回描画が完了しました。");
      ready = true;
    }
    if (moving || rendering.weather.active || animation.active)
      frame = requestAnimationFrame(render);
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
    computerInterface,
    roomSwitch,
    () => void boardLoader.refresh(true),
  );
  prepared = true;
  requestFrame();
  void boardLoader.refresh(false);
}
