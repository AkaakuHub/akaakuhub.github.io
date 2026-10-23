import { ACESFilmicToneMapping, HalfFloatType, WebGLRenderTarget } from "three";
import type { DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AntialiasPass } from "./antialias";
import { VolumetricPass } from "./volumetrics";

export function createRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  sun: DirectionalLight,
) {
  const compact = window.matchMedia("(pointer: coarse)").matches;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    samples: compact ? 0 : Math.min(2, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const ambientOcclusion = new GTAOPass(scene, camera, 1, 1);
  ambientOcclusion.updateGtaoMaterial({
    radius: 0.25,
    thickness: 0.5,
    samples: 12,
    distanceFallOff: 1,
  });
  ambientOcclusion.blendIntensity = 0.65;
  composer.addPass(ambientOcclusion);
  composer.addPass(
    new VolumetricPass(camera, sun, ambientOcclusion.depthTexture, compact ? 48 : 96),
  );
  composer.addPass(new OutputPass());
  if (compact) composer.addPass(new AntialiasPass());
  return composer;
}
