import "./tailwind.css";
import "./interface/keyboard.css";
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
import { prewarmRoomViews } from "./scene/rendering/prewarm";
import { createBoardLoader } from "./scene/board/loading";
import { prepareBoardFont, prepareBoardHeadingFont } from "./assets/typography";
import { createComputerInterface } from "./interface/computer";
import { createContributionDisplay } from "./scene/board/contribution-display";
import { loadSkillAtlas } from "./assets/skills";
import { skillText } from "./content/skills";

export async function startRoom(root: HTMLElement, loading: Loading) {
  const ui = createInterface(root);
  const weatherReady = loadTokyoWeather();
  const fontsReady = Promise.all([prepareBoardFont(skillText), prepareBoardHeadingFont()]);
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
  const skillAtlasReady = loadSkillAtlas(assets);
  const lightTablesReady = loadAreaLightTables(renderer, assets);
  const { materials } = materialLoading;
  const [initialWeather, skillAtlas] = await Promise.all([
    weatherReady,
    skillAtlasReady,
    materialLoading.paperReady,
    fontsReady,
  ]);
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  const { board, lightSwitch, rocker, computer } = assembleClubroom(scene, materials, skillAtlas);
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  await Promise.all([materialLoading.ready, lightTablesReady]);
  const lighting = illuminate(
    scene,
    renderer,
    weatherAt(initialWeather, Date.now()),
    computer.monitor,
  );
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
  const contributions = createContributionDisplay(board.contributions, invalidate);
  const rendering = createRendering(
    renderer,
    scene,
    camera,
    lighting.celestialLight,
    computer.monitor,
    computer.fanSurfaces,
    contributions.object,
  );
  const noticeList = [...board.notices.values()];
  const inspections = [...board.notices].map(([object, notice], index) => ({
    object,
    get width() {
      return notice.size[0];
    },
    get height() {
      return notice.size[1];
    },
    depth: 0,
    topAligned: index === 0 || index === 2,
  }));
  const view = createView(
    camera,
    inspections,
    computer,
    {
      object: computer.monitor,
      get width() {
        return computer.monitor.geometry.parameters.width;
      },
      get height() {
        return computer.monitor.geometry.parameters.height;
      },
      depth: 0.001,
      topAligned: false,
    },
    (state) => {
      ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
      ui.setMoving(true);
    },
    invalidate,
    () => ui.inspectionViewport(),
  );
  const computerInterface = createComputerInterface(
    computer,
    view,
    invalidate,
    requestFrame,
    lighting.setMonitorPower,
    ui.announce,
  );
  const roomSwitch = bindRoomSwitch(lightSwitch, rocker, lighting.setRoomLights, invalidate);
  let controls: ReturnType<typeof bindRoomControls>;
  const boardLoader = createBoardLoader((state) => {
    board.setState(state);
    controls.syncNotices();
    if (view.state.mode === "notice") ui.setView(view.state, noticeList[view.state.index]);
    invalidate();
  }, computerInterface.setState);
  let frame = 0;
  let previous = performance.now();
  let lastRendered = 0;
  let ready = false;
  let prepared = false;

  observeViewport(ui.canvas, camera, renderer, rendering, () => {
    if (computer.orientDisplay(camera.aspect < 1)) {
      computer.resizeInspection();
      lighting.setMonitorPower(computerInterface.targets.isPowered());
      renderer.shadowMap.needsUpdate = true;
    }
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
    const frameDuration = 1000 / 60;
    if (time - lastRendered < frameDuration - 0.5) {
      frame = requestAnimationFrame(render);
      return;
    }
    const seconds = (time - previous) / 1000;
    const moving = view.update(seconds);
    ui.setMoving(moving);
    previous = time;
    lastRendered = time;
    const scrolling = computerInterface.update(seconds, time);
    frameMetrics?.begin(moving);
    const animation = contributions.update(camera, time);
    rendering.render(moving);
    frameMetrics?.end(moving);
    if (!ready) {
      loading.complete();
      if (import.meta.env.DEV) console.info("部室の初回描画が完了しました。");
      ready = true;
      prewarmRoomViews(renderer, scene, camera, () => view.moving, loading.fail);
    }
    if (moving || rendering.weather.active || scrolling || animation)
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
  await rendering.compile();
  loading.rendering(1, 2);
  lighting.update(new Date(), weatherAt(weather.current, Date.now()));
  await rendering.compile();
  loading.rendering(2, 2);
  rendering.render();
  controls = bindRoomControls(
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
