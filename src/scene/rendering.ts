import { ACESFilmicToneMapping, DepthTexture, HalfFloatType, WebGLRenderTarget } from "three";
import type {
  BufferGeometry,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { AntialiasPass } from "./antialias";
import { VolumetricPass } from "./volumetrics";
import { renderingProfile } from "./quality";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";
import { DynamicSurfacePass } from "./rendering/dynamic-pass";

export function createRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  celestialLight: DirectionalLight,
  monitor: Mesh<BufferGeometry, MeshBasicMaterial>,
  fanSurfaces: readonly Mesh[],
  contributions: Object3D,
) {
  const profile = renderingProfile();
  const weather = new WeatherPass(camera);
  const surfaces = new ScenePass(scene, camera, [monitor, ...fanSurfaces, contributions]);
  renderer.toneMapping = ACESFilmicToneMapping;
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.addPass(surfaces);
  composer.addPass(new DynamicSurfacePass(monitor, fanSurfaces, contributions, scene, camera));
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
      surfaces.moving = moving;
      scattering.enabled = !moving && celestialLight.intensity > 0;
      composer.render();
    },
  };
}
