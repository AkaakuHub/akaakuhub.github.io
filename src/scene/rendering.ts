import { ACESFilmicToneMapping, DepthTexture, HalfFloatType, WebGLRenderTarget } from "three";
import type { DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AntialiasPass } from "./antialias";
import { VolumetricPass } from "./volumetrics";

export function createRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  celestialLight: DirectionalLight,
) {
  const compact = window.matchMedia("(pointer: coarse)").matches;
  renderer.toneMapping = ACESFilmicToneMapping;
  function pipeline(steps: number) {
    const target = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      depthTexture: new DepthTexture(1, 1),
    });
    const composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(1);
    composer.addPass(new RenderPass(scene, camera));
    const scattering = new VolumetricPass(camera, celestialLight, steps);
    composer.addPass(scattering);
    composer.addPass(new OutputPass());
    composer.addPass(new AntialiasPass());
    return { composer, scattering };
  }
  const still = pipeline(compact ? 24 : 48);
  const motion = pipeline(compact ? 12 : 24);
  let pixelRatio = 1;
  return {
    setPixelRatio(ratio: number) {
      pixelRatio = ratio;
    },
    setSize(width: number, height: number) {
      const pixelWidth = Math.max(1, Math.floor(width * pixelRatio));
      const pixelHeight = Math.max(1, Math.floor(height * pixelRatio));
      still.composer.setSize(pixelWidth, pixelHeight);
      motion.composer.setSize(
        Math.max(1, Math.floor(pixelWidth / 2)),
        Math.max(1, Math.floor(pixelHeight / 2)),
      );
    },
    render(moving = false) {
      const active = moving ? motion : still;
      active.scattering.enabled = celestialLight.intensity > 0;
      active.composer.render();
    },
  };
}
