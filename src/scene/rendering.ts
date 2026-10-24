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
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const scattering = new VolumetricPass(camera, celestialLight, compact ? 24 : 48);
  composer.addPass(scattering);
  composer.addPass(new OutputPass());
  composer.addPass(new AntialiasPass());
  return {
    setPixelRatio: (ratio: number) => composer.setPixelRatio(ratio),
    setSize: (width: number, height: number) => composer.setSize(width, height),
    render() {
      scattering.enabled = celestialLight.intensity > 0;
      composer.render();
    },
  };
}
