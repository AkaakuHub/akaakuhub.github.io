import { DepthTexture, HalfFloatType, MathUtils, NoToneMapping, RenderTarget } from "three";
import type { DirectionalLight, Mesh, Object3D, PerspectiveCamera, Scene } from "three";
import { ConvertNode, MeshBasicNodeMaterial, QuadMesh } from "three/webgpu";
import type { Renderer } from "three/webgpu";
import { float, texture, uniform, vec4 } from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { VolumetricPass } from "./volumetrics";
import { renderingProfile } from "./quality";
import { WeatherPass } from "./weather";
import { ScenePass } from "./rendering/scene-pass";
import { DynamicSurfacePass } from "./rendering/dynamic-pass";

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
  const composite = new RenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
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
  const source = texture(frame.texture);
  const exposure = uniform(renderer.toneMappingExposure);
  const display = window.matchMedia("(dynamic-range: high)");
  const headroom = uniform(display.matches ? 4 : 1);
  display.addEventListener("change", () => {
    headroom.value = display.matches ? 4 : 1;
  });
  const antialiased = new ConvertNode<"vec4">(fxaa(source), "vec4");
  const color = antialiased.rgb.mul(exposure).max(0);
  const mapped = headroom.mul(float(1).sub(color.div(headroom).negate().exp()));
  const visibility = uniform(0);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const output = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  output.fragmentNode = vec4(mapped.mul(visibility), 1);
  const quad = new QuadMesh(output);
  let pixelRatio = 1;
  let startedAt: number | undefined;
  return {
    weather,
    get revealing() {
      return visibility.value < 1;
    },
    invalidate: () => surfaces.invalidate(),
    setPixelRatio(ratio: number) {
      pixelRatio = ratio;
    },
    setSize(width: number, height: number) {
      const w = Math.max(1, Math.floor(width * pixelRatio));
      const h = Math.max(1, Math.floor(height * pixelRatio));
      frame.setSize(w, h);
      composite.setSize(w, h);
      surfaces.setSize(w, h);
      scattering.setSize(w, h);
    },
    render(moving = false) {
      const now = performance.now();
      startedAt ??= now;
      visibility.value = reducedMotion.matches ? 1 : MathUtils.smoothstep(now - startedAt, 0, 300);
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
        if (celestialLight.intensity > 0) {
          scattering.render(renderer, composite, input);
          source.value = composite.texture;
        } else source.value = input.texture;
        exposure.value = renderer.toneMappingExposure;
        renderer.setRenderTarget(null);
        quad.render(renderer);
      } finally {
        renderer.autoClear = autoClear;
      }
    },
  };
}
