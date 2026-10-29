import { DepthTexture, HalfFloatType, NoToneMapping, RenderTarget } from "three";
import type { Mesh, Object3D, PerspectiveCamera, Scene } from "three";
import type { Renderer } from "three/webgpu";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";
import { DynamicSurfacePass } from "./rendering/dynamic-pass";
import { DisplayPass } from "./rendering/display-pass";
import { renderingProfile } from "./quality";
import { fitPixelBudget } from "./rendering/resolution";

export function createRendering(
  renderer: Renderer,
  scene: Scene,
  camera: PerspectiveCamera,
  monitor: Mesh,
  fanSurfaces: readonly Mesh[],
  contributions: Object3D,
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
  const motionPixelBudget = renderingProfile().motionPixelBudget;
  const surfaces = new ScenePass(scene, camera, [monitor, ...fanSurfaces, contributions]);
  const dynamic = new DynamicSurfacePass(monitor, fanSurfaces, contributions, scene, camera);
  const weather = new WeatherPass(camera);
  const display = new DisplayPass(renderer, frame.texture);
  let pixelRatio = 1;
  return {
    weather,
    get revealing() {
      return display.revealing;
    },
    invalidate: () => surfaces.invalidate(),
    setPixelRatio(ratio: number) {
      pixelRatio = ratio;
    },
    setSize(width: number, height: number) {
      const w = Math.max(1, Math.floor(width * pixelRatio));
      const h = Math.max(1, Math.floor(height * pixelRatio));
      frame.setSize(w, h);
      const motion = fitPixelBudget(w, h, motionPixelBudget);
      motionFrame.setSize(motion.width, motion.height);
      surfaces.setSize(w, h);
    },
    render(moving = false) {
      const compose = (!moving && dynamic.visible) || weather.active;
      const target = moving ? motionFrame : frame;
      const input = surfaces.render(renderer, target, moving, compose);
      if (compose) {
        if (!moving) dynamic.render(renderer, target);
        weather.render(renderer, target);
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = true;
      try {
        display.setSize(input.width, input.height, moving);
        display.render(input.texture, surfaces.revision, compose);
      } finally {
        renderer.autoClear = autoClear;
      }
    },
  };
}
