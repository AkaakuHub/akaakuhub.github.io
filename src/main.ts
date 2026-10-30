import "./tailwind.css";
import "./interface/keyboard.css";
import { Color, PCFShadowMap, PerspectiveCamera, Scene, WebGPUCoordinateSystem } from "three";
import { createRoomRenderer } from "./scene/rendering/renderer";
import { createInterface } from "./interface";
import type { Loading } from "./interface/loading";
import { bindRoomSwitch } from "./interface/room-switch";
import { bindRoomControls } from "./interface/controls";
import { assembleClubroom } from "./scene/clubroom";
import { createStaticBatcher } from "./scene/static-batches";
import { illuminate } from "./scene/lighting";
import type { RoomAssetLoader } from "./assets/loading";
import { loadMaterials } from "./scene/materials/library";
import { createRendering } from "./scene/rendering";
import { createView } from "./scene/view";
import { boardInspections } from "./scene/view/board";
import { observeViewport } from "./scene/viewport";
import { observeTokyoWeather } from "./weather/client";
import { weatherAt } from "./weather/schema";
import type { WeatherDay } from "./weather/schema";
import { createFrameMetrics } from "./scene/frame-metrics";
import { loadAreaLightTables } from "./scene/lighting/area-tables";
import { bindRenderingErrors } from "./scene/rendering/errors";
import { createBoardLoader } from "./scene/board/loading";
import { prepareBoardHeadingFont } from "./assets/typography";
import { createComputerInterface } from "./interface/computer";
import { createContributionDisplay } from "./scene/board/contribution-display";
import { createIntroduction } from "./interface/introduction";
import { createDirectionControls } from "./interface/directions";
import type { WeatherAudio } from "./scene/audio";
import { bindSoundControl } from "./interface/sound";
import { finishFirstFrame } from "./scene/rendering/first-frame";
import { createControlIntroduction } from "./interface/control-introduction";
import { bindMotionControl } from "./interface/motion";
import type { PaperPrinter } from "./scene/board/printing";
import { createRoomPassages } from "./interface/passages";
import { createFluorescentAnimation } from "./scene/lighting/fluorescent-animation";
import { observeDisplayVisibility } from "./scene/rendering/display-lifecycle";

export async function startRoom(
  root: HTMLElement,
  loading: Loading,
  weatherReady: Promise<WeatherDay>,
  assets: RoomAssetLoader,
  audio: WeatherAudio,
  avatarReady: Promise<ImageBitmap>,
  printer: PaperPrinter,
) {
  performance.mark("room-startup");
  const ui = createInterface(root);
  const batchStaticMeshes = createStaticBatcher();
  const fontsReady = prepareBoardHeadingFont();
  let deviceLost = false;
  const rendererReady = createRoomRenderer(ui.canvas).then((renderer) => {
    bindRenderingErrors(renderer, loading.fail, (error) => {
      deviceLost = true;
      loading.recover(error);
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    performance.mark("room-renderer-ready");
    return renderer;
  });
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.coordinateSystem = WebGPUCoordinateSystem;
  camera.position.set(0, 1.55, 0.45);
  const materialLoading = loadMaterials(assets);
  const lightTablesReady = loadAreaLightTables(rendererReady, assets);
  const { materials } = materialLoading;
  const clubroomReady = Promise.all([avatarReady, materialLoading.paperReady, fontsReady]).then(
    async ([avatar]) => {
      performance.mark("room-geometry-start");
      const room = await assembleClubroom(scene, materials, avatar, batchStaticMeshes, printer);
      performance.mark("room-geometry-ready");
      return room;
    },
  );
  const [
    renderer,
    initialWeather,
    { board, privacy, door, windowOpening, lightSwitch, rocker, computer },
  ] = await Promise.all([
    rendererReady,
    weatherReady,
    clubroomReady,
    materialLoading.loadRemaining().then(() => performance.mark("room-textures-ready")),
    lightTablesReady,
  ]);
  performance.mark("room-assets-and-geometry-ready");
  const frameMetrics = import.meta.env.DEV ? createFrameMetrics(renderer) : undefined;
  loading.rendering(1, 4);
  const lighting = illuminate(
    scene,
    renderer,
    weatherAt(initialWeather, Date.now()),
    computer.monitor,
  );
  const fluorescent = createFluorescentAnimation(
    scene,
    camera,
    lighting.setFluorescentModulation,
    invalidate,
  );
  audio.updateWeather(weatherAt(initialWeather, Date.now()));
  const weather = observeTokyoWeather(
    initialWeather,
    (current) => {
      const sample = weatherAt(current, Date.now());
      audio.updateWeather(sample);
      lighting.update(new Date(), sample);
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
    computer.monitor,
    computer.fanSurfaces,
    contributions.object,
  );
  loading.rendering(2, 4);
  const noticeList = [...board.notices.values()];
  const inspections = boardInspections(board.notices);
  let introduction: ReturnType<typeof createIntroduction> | undefined;
  let updateDirections: ReturnType<typeof createDirectionControls> | undefined;
  const view = createView(
    camera,
    inspections,
    computer,
    privacy,
    (state) => {
      ui.setView(state, state.mode === "notice" ? noticeList[state.index] : undefined);
      ui.setMoving(true);
      introduction?.update(state);
      updateDirections?.(state);
    },
    invalidate,
    () => ui.inspectionViewport(),
  );
  introduction = createIntroduction(root, () => view.back());
  updateDirections = createDirectionControls(root, view);
  updateDirections(view.state);
  const controlIntroduction = createControlIntroduction(root);
  bindSoundControl(root, audio, controlIntroduction);
  bindMotionControl(root, view.setMotion, ui.announce, controlIntroduction);
  const computerInterface = createComputerInterface(
    computer,
    view,
    invalidate,
    requestFrame,
    lighting.setMonitorPower,
  );
  const requestPassageFrame = (geometryChanged: boolean): void => {
    if (geometryChanged) {
      lighting.invalidateShadows();
      invalidate();
    } else requestFrame();
  };
  const passages = createRoomPassages(
    root,
    camera,
    view,
    { door, windowOpening },
    requestPassageFrame,
    ui.announce,
  );
  const roomSwitch = bindRoomSwitch(lightSwitch, rocker, lighting.setRoomLights, invalidate);
  let controls: ReturnType<typeof bindRoomControls>;
  const boardLoader = createBoardLoader(async (state) => {
    const printed = await board.setState(state);
    for (const map of printed) renderer.initTexture(map);
    if (prepared) controls.syncNotices();
    if (view.state.mode === "notice") ui.setView(view.state, noticeList[view.state.index]);
    invalidate();
  });
  let frame = 0;
  let previous = performance.now();
  let lastRendered = 0;
  let ready = false;
  let prepared = false;
  let displayActive = true;

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
    audio.updateWeather(sample);
    lighting.update(new Date(), sample);
    if (scene.background instanceof Color) rendering.weather.update(sample, scene.background);
    lighting.invalidateShadows();
    invalidate();
  }
  setInterval(updateTime, 60_000);

  function render(time: number) {
    frame = 0;
    if (document.hidden || !displayActive || !prepared || deviceLost) return;
    const frameDuration = 1000 / 60;
    if (time - lastRendered < frameDuration - 0.5) {
      frame = requestAnimationFrame(render);
      return;
    }
    const seconds = (time - previous) / 1000;
    const viewMoving = view.update(seconds);
    let passageMoving = false;
    for (const passage of passages) passageMoving = passage.update(seconds) || passageMoving;
    const moving = viewMoving || passageMoving;
    audio.updateCamera(camera);
    ui.setMoving(moving);
    previous = time;
    lastRendered = time;
    computerInterface.update(time);
    frameMetrics?.begin(moving);
    const animation = contributions.update(camera, time);
    rendering.render(moving);
    frameMetrics?.end(moving);
    if (!ready) {
      ready = true;
      void finishFirstFrame()
        .then(() => {
          loading.complete();
          fluorescent.start();
          const measurement = performance.measure("room-first-frame", { start: 0 });
          if (import.meta.env.DEV)
            console.info(`部室の初回描画: ${measurement.duration.toFixed(0)}ms`);
          audio.start();
          controlIntroduction.start();
          introduction?.start();
          contributions.load();
        })
        .catch(loading.fail);
    }
    if (!frame && (moving || rendering.weather.active || animation || rendering.revealing))
      frame = requestAnimationFrame(render);
  }
  function invalidate() {
    rendering.invalidate();
    requestFrame();
  }
  function requestFrame() {
    if (frame || document.hidden || !displayActive || deviceLost) return;
    previous = performance.now() - 16;
    frame = requestAnimationFrame(render);
  }
  updateTime();
  void boardLoader.refresh(false);
  loading.rendering(3, 4);
  lighting.update(new Date(), weatherAt(weather.current, Date.now()));
  performance.mark("room-lighting-ready");
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
    passages,
    privacy.object,
  );
  loading.rendering(4, 4);
  prepared = true;
  observeSize();
  observeDisplayVisibility((active) => {
    if (deviceLost) return;
    displayActive = active;
    rendering.setActive(active);
    if (active) {
      updateTime();
      invalidate();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      rendering.render();
    }
  });
  requestFrame();
}
