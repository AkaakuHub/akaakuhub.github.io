import { DepthTexture, HalfFloatType, NoToneMapping, RenderTarget } from "three";
import type { Mesh, Object3D, PerspectiveCamera, Scene } from "three";
import type { RoomRenderer, HdrObserver } from "./rendering/room-renderer";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";
import { DynamicSurfacePass } from "./rendering/dynamic-pass";
import { DisplayPass } from "./rendering/display-pass";
import { fitPixelBudget } from "./rendering/resolution";
import { SceneTransforms } from "./rendering/scene-transforms";
import { SkyPass } from "./rendering/sky-pass";
import type { createSky } from "./daylight/sky";
import { StaticSceneBundles } from "./rendering/static-bundles";
import { ShaderWarmup } from "./rendering/shader-warmup";
import { prepareScene } from "./rendering/prepare-scene";
import { MotionResolution } from "./rendering/motion-resolution";

export async function createRendering(
  renderer: RoomRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  monitor: Mesh,
  fanSurfaces: readonly Mesh[],
  contributions: Object3D,
  sky: Awaited<ReturnType<typeof createSky>>,
  progress: (value: number) => void,
) {
  renderer.toneMapping = NoToneMapping;
  const depth = new DepthTexture(1, 1);
  const frame = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: depth,
  });
  const motionFrame = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  const motionResolution = new MotionResolution(renderer.profile.motionPixelBudget);
  scene.add(sky.horizon);
  await prepareScene(renderer, scene, camera, frame, progress);
  const bundles = new StaticSceneBundles(scene);
  const transforms = new SceneTransforms(scene);
  const dynamic = new DynamicSurfacePass(
    monitor,
    fanSurfaces,
    contributions,
    scene,
    camera,
    bundles.root,
  );
  const surfaces = new ScenePass(
    scene,
    camera,
    [monitor, ...fanSurfaces, contributions],
    (renderer, target) => dynamic.renderStatic(renderer, target),
  );
  const weather = new WeatherPass(camera);
  const skyPass = new SkyPass(sky.object, camera);
  const display = new DisplayPass(renderer, frame.texture);
  let pixelRatio = 1;
  return {
    warmup: new ShaderWarmup(renderer, scene, camera, frame),
    weather,
    get skyVisible() {
      return skyPass.visible;
    },
    observeHdr: (observer: HdrObserver) => renderer.observeHdr(observer),
    toggleHdr: () => renderer.toggleHdr(),
    invalidate() {
      bundles.invalidate();
      transforms.invalidate();
      surfaces.invalidate();
    },
    resume() {
      bundles.invalidate();
      renderer.refreshDisplay();
      display.invalidate();
      surfaces.invalidate();
      transforms.invalidate();
    },
    setPixelRatio(ratio: number) {
      pixelRatio = ratio;
    },
    setSize(width: number, height: number) {
      const w = Math.max(1, Math.floor(width * pixelRatio));
      const h = Math.max(1, Math.floor(height * pixelRatio));
      frame.setSize(w, h);
      const motion = fitPixelBudget(w, h, motionResolution.budget);
      motionFrame.setSize(motion.width, motion.height);
      surfaces.setSize(w, h);
    },
    render({
      moving,
      computerActive,
      contributionsActive,
      seconds,
    }: {
      moving: boolean;
      computerActive: boolean;
      contributionsActive: boolean;
      seconds: number;
    }) {
      if (motionResolution.sample(seconds, moving)) {
        const size = fitPixelBudget(frame.width, frame.height, motionResolution.budget);
        motionFrame.setSize(size.width, size.height);
      }
      transforms.update();
      bundles.update(camera);
      if (dynamic.setActive(computerActive, contributionsActive)) surfaces.invalidate();
      const precipitation = weather.active;
      const skyVisible = skyPass.visible;
      const compose = skyVisible || (!moving && dynamic.visible) || precipitation;
      const target = moving ? motionFrame : frame;
      const input = surfaces.render(renderer, target, moving, compose);
      if (compose) {
        if (skyVisible) skyPass.render(renderer, target);
        if (!moving) dynamic.render(renderer, target);
        if (precipitation) weather.render(renderer, target);
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = true;
      try {
        display.setSize(input.width, input.height, moving);
        display.render(input.texture, surfaces.revision, compose);
      } finally {
        renderer.autoClear = autoClear;
      }
      return precipitation;
    },
  };
}
