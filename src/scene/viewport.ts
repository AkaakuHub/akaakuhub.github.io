import { MathUtils } from "three";
import type { PerspectiveCamera, WebGLRenderer } from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

export function observeViewport(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  composer: EffectComposer,
  invalidate: () => void,
): void {
  const compact = window.matchMedia("(pointer: coarse)");
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const budget = compact.matches ? 900_000 : 2_000_000;
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      compact.matches ? 1.5 : 1.75,
      Math.sqrt(budget / (width * height)),
    );
    camera.aspect = width / height;
    const fittingFov = MathUtils.radToDeg(
      2 * Math.atan(Math.tan(MathUtils.degToRad(34)) / camera.aspect),
    );
    camera.fov = MathUtils.clamp(fittingFov, 58, 82);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  compact.addEventListener("change", resize);
  window.addEventListener("resize", resize);
}
