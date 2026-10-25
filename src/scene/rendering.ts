import { ACESFilmicToneMapping, DepthTexture, HalfFloatType, WebGLRenderTarget } from "three";
import type { DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { AntialiasPass } from "./antialias";
import { VolumetricPass } from "./volumetrics";
import { renderingProfile } from "./quality";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";

export function createRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  celestialLight: DirectionalLight,
) {
  const profile = renderingProfile();
  const weather = new WeatherPass(camera);
  const surfaces = new ScenePass(scene, camera);
  renderer.toneMapping = ACESFilmicToneMapping;
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.addPass(surfaces);
  composer.addPass(weather);
  const scattering = new VolumetricPass(
    camera,
    celestialLight,
    profile.scatteringSteps,
    () => surfaces.revision,
  );
  composer.addPass(scattering);
  composer.addPass(new OutputPass());
  composer.addPass(new AntialiasPass());
  let pixelRatio = 1;
  return {
    weather,
    invalidate: () => surfaces.invalidate(),
    setPixelRatio(ratio: number) {
      pixelRatio = ratio;
    },
    setSize(width: number, height: number) {
      const pixelWidth = Math.max(1, Math.floor(width * pixelRatio));
      const pixelHeight = Math.max(1, Math.floor(height * pixelRatio));
      composer.setSize(pixelWidth, pixelHeight);
    },
    render(moving = false) {
      scattering.setSteps(moving ? profile.motionScatteringSteps : profile.scatteringSteps);
      scattering.enabled = celestialLight.intensity > 0;
      composer.render();
    },
  };
}
