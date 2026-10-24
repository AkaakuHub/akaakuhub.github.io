import { ACESFilmicToneMapping, HalfFloatType, WebGLRenderTarget } from "three";
import type { DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AntialiasPass } from "./antialias";
import { VolumetricPass } from "./volumetrics";
import { SurfaceDepthPass } from "./occlusion";

export function createRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  sun: DirectionalLight,
) {
  const compact = window.matchMedia("(pointer: coarse)").matches;
  renderer.toneMapping = ACESFilmicToneMapping;
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    samples: compact ? 0 : Math.min(2, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const surfaces = new SurfaceDepthPass(scene, camera);
  composer.addPass(surfaces);
  if (!compact) {
    const ambientOcclusion = new GTAOPass(scene, camera, 1, 1);
    ambientOcclusion.setGBuffer(surfaces.depthTexture, surfaces.normalTexture);
    const depthUniform = ambientOcclusion.depthRenderMaterial.uniforms.tDepth;
    if (!depthUniform) throw new Error("接触影の深度を設定できませんでした。");
    depthUniform.value = surfaces.depthTexture;
    ambientOcclusion.updateGtaoMaterial({
      radius: 0.25,
      thickness: 0.18,
      samples: 12,
      distanceFallOff: 1,
    });
    ambientOcclusion.blendIntensity = 0.4;
    composer.addPass(ambientOcclusion);
  }
  composer.addPass(new VolumetricPass(camera, sun, surfaces.depthTexture, compact ? 48 : 96));
  composer.addPass(new OutputPass());
  if (compact) composer.addPass(new AntialiasPass());
  return composer;
}
