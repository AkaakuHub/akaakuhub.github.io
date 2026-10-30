import "./tailwind.css";
import "./interface/keyboard.css";
import { Color, PCFShadowMap, PerspectiveCamera, Scene } from "three";
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
import { NoticeTour } from "./scene/view/notice-tour";
import { observeViewport } from "./scene/viewport";
import { observeTokyoWeather } from "./weather/client";
import { weatherAt } from "./weather/schema";
import type { WeatherDay } from "./weather/schema";
import { createFrameMetrics } from "./scene/frame-metrics";
import { loadAreaLightTables } from "./scene/lighting/area-tables";
import { bindRenderingErrors } from "./scene/rendering/errors";
import { createBoardLoader } from "./scene/board/loading";
import { createComputerInterface } from "./interface/computer";
import { createContributionDisplay } from "./scene/board/contribution-display";
import { createIntroduction } from "./interface/introduction";
import { createDirectionControls } from "./interface/directions";
import type { WeatherAudio } from "./scene/audio";
import { bindSoundControl } from "./interface/sound";
import { bindHdrControl } from "./interface/hdr";
import { finishFirstFrame } from "./scene/rendering/first-frame";
import { createControlIntroduction } from "./interface/control-introduction";
import type { PaperPrinter } from "./scene/board/printing";
import { createRoomPassages } from "./interface/passages";
import { createFluorescentAnimation } from "./scene/lighting/fluorescent-animation";
import { observeDisplayVisibility } from "./scene/rendering/display-lifecycle";
import { createSky } from "./scene/daylight/sky";
import { createSkyAnimation } from "./scene/daylight/sky-animation";
import { FrameScheduler } from "./scene/rendering/frame-scheduler";
import { renderingSession } from "./scene/rendering/session";

export async function startRoom(
  root: HTMLElement,
  loading: Loading,
  weatherReady: Promise<WeatherDay>,
  assets: RoomAssetLoader,
  audio: WeatherAudio,
  avatarReady: Promise<ImageBitmap>,
  printer: PaperPrinter,
  fontsReady: Promise<void>,
) {
  const ui = createInterface(root);
  const batchStaticMeshes = createStaticBatcher();
  let deviceLost = false;
  const recoverRendering = (error: unknown): void => {
    deviceLost = true;
    if (!renderingSession.retryWebGL()) loading.recover(error);
  };
  const rendererReady = createRoomRenderer(ui.canvas).then((renderer) => {
    bindRenderingErrors(renderer, recoverRendering);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    performance.mark("room-renderer-ready");
    return renderer;
  });
  const scene = new Scene();
  const camera = new PerspectiveCamera(62, 1, 0.05, 40);
  camera.position.set(0, 1.55, 0.45);
  const materialLoading = loadMaterials(assets);
  const skyReady = createSky(assets);
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
    sky,
  ] = await Promise.all([
    rendererReady,
    weatherReady,
    clubroomReady,
    skyReady,
    materialLoading.loadRemaining().then(() => performance.mark("room-textures-ready")),
    lightTablesReady,
  ]);
  camera.coordinateSystem = renderer.coordinateSystem;
  camera.updateProjectionMatrix();
  performance.mark("room-assets-and-geometry-ready");
  const frameMetrics = import.meta.env.DEV ? createFrameMetrics(renderer) : undefined;
  loading.rendering(1, 4);
  const lighting = illuminate(
    scene,
    renderer,
    weatherAt(initialWeather, Date.now()),
    computer.monitor,
    sky,
  );
  const fluorescent = createFluorescentAnimation(
    scene,
    camera,
    lighting.setFluorescentModulation,
    invalidate,
  );
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
  const rendering = await createRendering(
    renderer,
    scene,
    camera,
    computer.monitor,
    computer.fanSurfaces,
    contributions.object,
    sky,
    (value) => loading.rendering(1 + value, 4),
  );
  loading.rendering(2, 4);
  const animateSky = createSkyAnimation(sky, rendering, lighting, requestFrame);
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
      introduction?.update();
      updateDirections?.(state);
    },
    requestFrame,
    () => ui.inspectionViewport(),
    new NoticeTour(localStorage, inspections.length - 1),
  );
  introduction = createIntroduction(root, view);
  updateDirections = createDirectionControls(root, view);
  updateDirections(view.state);
  const controlIntroduction = createControlIntroduction(root);
  bindSoundControl(root, audio, controlIntroduction);
  bindHdrControl(root, rendering, requestFrame, ui.announce);
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
  const frames = new FrameScheduler(render, () => renderer.completedFrame(), recoverRendering);
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

  function render(time: number, seconds: number): boolean {
    if (document.hidden || !displayActive || !prepared || deviceLost) return false;
    const viewMoving = view.update(seconds);
    let passageMoving = false;
    for (const passage of passages) passageMoving = passage.update(seconds) || passageMoving;
    const moving = viewMoving || passageMoving;
    animateSky(time);
    audio.updateCamera(camera);
    ui.setMoving(moving);
    computerInterface.update(time);
    frameMetrics?.begin(moving);
    const animation = contributions.update(camera, time);
    const precipitation = rendering.render({
      moving,
      rotating: view.rotating,
      computerActive: computerInterface.isPowered(),
      contributionsActive: animation,
    });
    frameMetrics?.end(moving);
    if (!ready) {
      ready = true;
      void renderer
        .completedFrame()
        .then(finishFirstFrame)
        .then(() => {
          loading.complete();
          fluorescent.start();
          audio.start();
          controlIntroduction.start();
          introduction?.start();
          contributions.load();
        })
        .catch(recoverRendering);
    }
    return moving || precipitation || animation;
  }
  function invalidate() {
    rendering.invalidate();
    requestFrame();
  }
  function requestFrame() {
    if (document.hidden || !displayActive || deviceLost) return;
    frames.request();
  }
  updateTime();
  void boardLoader.refresh(false);
  loading.rendering(3, 4);
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
    privacy,
  );
  loading.rendering(4, 4);
  prepared = true;
  observeSize();
  observeDisplayVisibility((active) => {
    if (deviceLost) return;
    displayActive = active;
    frames.setActive(active);
    if (active) {
      rendering.resume();
      updateTime();
      invalidate();
    }
  });
  requestFrame();
}
