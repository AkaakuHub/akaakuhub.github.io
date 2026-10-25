import { DepthTexture, HalfFloatType, NoToneMapping, RenderTarget } from "three";
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
    () => surfaces.revision,
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
  const output = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  output.fragmentNode = vec4(mapped, 1);
  const quad = new QuadMesh(output);
  let pixelRatio = 1;
  return {
    weather,
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
      surfaces.render(renderer, frame, moving);
      dynamic.render(renderer, frame);
      weather.render(renderer, frame);
      const autoClear = renderer.autoClear;
      renderer.autoClear = true;
      try {
        if (!moving && celestialLight.intensity > 0) {
          scattering.render(renderer, composite);
          source.value = composite.texture;
        } else source.value = frame.texture;
        exposure.value = renderer.toneMappingExposure;
        renderer.setRenderTarget(null);
        quad.render(renderer);
      } finally {
        renderer.autoClear = autoClear;
      }
    },
  };
}
