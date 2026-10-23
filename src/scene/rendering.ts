import { HalfFloatType, WebGLRenderTarget } from "three";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

export function createRendering(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
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
  composer.addPass(new OutputPass());
  return composer;
}
