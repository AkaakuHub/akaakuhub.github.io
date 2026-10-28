import { DepthTexture, HalfFloatType, NoToneMapping, RenderTarget } from "three";
import type { DirectionalLight, Mesh, Object3D, PerspectiveCamera, Scene } from "three";
import type { Renderer } from "three/webgpu";
import { VolumetricPass } from "./volumetrics";
import { renderingProfile } from "./quality";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";
import { DynamicSurfacePass } from "./rendering/dynamic-pass";
import { DisplayPass } from "./rendering/display-pass";

export function createRendering(
  renderer: Renderer,
  scene: Scene,
  camera: PerspectiveCamera,
  celestialLight: DirectionalLight,
  monitor: Mesh,
  fanSurfaces: readonly Mesh[],
  contributions: Object3D,
) {
  renderer.toneMapping = NoToneMapping;
  const profile = renderingProfile();
  const depth = new DepthTexture(1, 1);
  const frame = new RenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: depth,
  });
  const surfaces = new ScenePass(scene, camera, [monitor, ...fanSurfaces, contributions]);
  const dynamic = new DynamicSurfacePass(monitor, fanSurfaces, contributions, scene, camera);
  const weather = new WeatherPass(camera);
  const scattering = new VolumetricPass(
    camera,
    celestialLight,
    depth,
    frame.texture,
    profile.scatteringSteps,
  );
  const display = new DisplayPass(frame.texture, scattering.colorNode);
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
      display.setSize(w, h);
      surfaces.setSize(w, h);
      scattering.setSize(w, h);
    },
    render(moving = false) {
      if (celestialLight.shadow.needsUpdate) scattering.invalidate();
      const compose = dynamic.visible || weather.active;
      const input = surfaces.render(renderer, frame, moving, compose);
      if (compose) {
        dynamic.render(renderer, frame);
        weather.render(renderer, frame);
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = true;
      try {
        const changed = scattering.render(renderer, input);
        display.render(
          renderer,
          input.texture,
          surfaces.revision,
          celestialLight.intensity > 0,
          compose || changed,
        );
      } finally {
        renderer.autoClear = autoClear;
      }
    },
  };
}
