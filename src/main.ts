import "./tailwind.css";
import "./interface/keyboard.css";
import { Color, PCFShadowMap, PerspectiveCamera, Scene, WebGPUCoordinateSystem } from "three";
import { createRoomRenderer } from "./scene/rendering/renderer";
import { createInterface } from "./interface";
import type { Loading } from "./interface/loading";
import { bindRoomSwitch } from "./interface/room-switch";
import { bindRoomControls } from "./interface/controls";
import { assembleClubroom } from "./scene/clubroom";
import { illuminate } from "./scene/lighting";
import type { RoomAssetLoader } from "./assets/loading";
import { loadMaterials } from "./scene/materials/library";
import { createRendering } from "./scene/rendering";
import { createView } from "./scene/view";
import { observeViewport } from "./scene/viewport";
import { observeTokyoWeather } from "./weather/client";
import { weatherAt } from "./weather/schema";
import type { WeatherDay } from "./weather/schema";
import { createFrameMetrics } from "./scene/frame-metrics";
import { loadAreaLightTables } from "./scene/lighting/area-tables";
import { bindRenderingErrors } from "./scene/rendering/errors";
import { prewarmRoomViews } from "./scene/rendering/prewarm";
import { prepareRoomShaders } from "./scene/rendering/prepare";
import { createBoardLoader } from "./scene/board/loading";
import { prepareBoardFont, prepareBoardHeadingFont } from "./assets/typography";
import { createComputerInterface } from "./interface/computer";
import { createContributionDisplay } from "./scene/board/contribution-display";
import { loadSkillAtlas } from "./assets/skills";
import { createIntroduction } from "./interface/introduction";
import { createCornerControls } from "./interface/corners";

export async function startRoom(
  root: HTMLElement,
  loading: Loading,
  weatherReady: Promise<WeatherDay>,
  assets: RoomAssetLoader,
) {
  const ui = createInterface(root);
  const fontsReady = Promise.all([prepareBoardFont(""), prepareBoardHeadingFont()]);
  const rendererReady = createRoomRenderer(ui.canvas).then((renderer) => {
    bindRenderingErrors(renderer, loading.fail);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    return renderer;
  });
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.coordinateSystem = WebGPUCoordinateSystem;
  camera.position.set(0, 1.55, 0.45);
  const materialLoading = loadMaterials(rendererReady, assets);
  const skillAtlasReady = loadSkillAtlas(assets);
  const lightTablesReady = loadAreaLightTables(rendererReady, assets);
  const { materials } = materialLoading;
  const [renderer, initialWeather, skillAtlas] = await Promise.all([
    rendererReady,
    weatherReady,
    skillAtlasReady,
    materialLoading.paperReady,
    fontsReady,
  ]);
  const frameMetrics = import.meta.env.DEV ? createFrameMetrics(renderer) : undefined;
  const { board, lightSwitch, rocker, computer } = assembleClubroom(scene, materials, skillAtlas);
  loading.rendering(1, 4);
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
  loading.rendering(2, 4);
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
  let introduction: ReturnType<typeof createIntroduction> | undefined;
  let updateCorners: ReturnType<typeof createCornerControls> | undefined;
  const view = createView(
    camera,
    inspections,
    computer,
    (state) => {
      ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
      ui.setMoving(true);
      introduction?.update(state);
      updateCorners?.(state);
    },
    invalidate,
    () => ui.inspectionViewport(),
  );
  introduction = createIntroduction(root, () => view.back());
  updateCorners = createCornerControls(root, view);
  updateCorners(view.state);
  const computerInterface = createComputerInterface(
    computer,
    view,
    invalidate,
    requestFrame,
    lighting.setMonitorPower,
  );
  const roomSwitch = bindRoomSwitch(lightSwitch, rocker, lighting.setRoomLights, invalidate);
  let controls: ReturnType<typeof bindRoomControls>;
  const boardLoader = createBoardLoader((state) => {
    board.setState(state);
    controls.syncNotices();
    if (view.state.mode === "notice") ui.setView(view.state, noticeList[view.state.index]);
    invalidate();
  });
  let frame = 0;
  let previous = performance.now();
  let lastRendered = 0;
  let ready = false;
  let prepared = false;

  const observeSize = observeViewport(ui.canvas, camera, renderer, rendering, () => {
    if (computer.orientDisplay(camera.aspect < 1)) {
      computer.resizeInspection();
      lighting.setMonitorPower(computerInterface.isPowered());
      lighting.invalidateShadows();
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
    lighting.invalidateShadows();
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
    computerInterface.update(time);
    frameMetrics?.begin(moving);
    const animation = contributions.update(camera, time);
    rendering.render(moving);
    frameMetrics?.end(moving);
    if (!ready) {
      loading.complete();
      const measurement = performance.measure("room-first-frame", { start: 0 });
      if (import.meta.env.DEV) console.info(`部室の初回描画: ${measurement.duration.toFixed(0)}ms`);
      ready = true;
      introduction?.start();
      contributions.load();
      void boardLoader.refresh(false);
      prewarmRoomViews(renderer, scene, camera, () => view.moving, loading.fail);
    }
    if (!frame && (moving || rendering.weather.active || animation))
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
  await prepareRoomShaders(renderer, scene, camera, ({ loaded, total }) => {
    loading.rendering(2 + loaded / total, 4);
  });
  lighting.update(new Date(), weatherAt(weather.current, Date.now()));
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
  loading.rendering(4, 4);
  prepared = true;
  observeSize();
  requestFrame();
}
