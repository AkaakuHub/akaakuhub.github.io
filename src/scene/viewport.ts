import type { PerspectiveCamera, WebGLRenderer } from "three";
import type { createRendering } from "./rendering";

export function observeViewport(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  composer: ReturnType<typeof createRendering>,
  onResize: () => void,
): void {
  const container = canvas.parentElement;
  if (!container) throw new Error("部屋の表示領域が見つかりません。");
  const compact = window.matchMedia("(pointer: coarse)");
  let pending = 0;
  let previousWidth = 0;
  let previousHeight = 0;
  let previousRatio = 0;
  const resize = () => {
    pending = 0;
    const { width, height } = container.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const budget = compact.matches ? 900_000 : 2_000_000;
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      compact.matches ? 1.5 : 1.75,
      Math.sqrt(budget / (width * height)),
    );
    if (width === previousWidth && height === previousHeight && pixelRatio === previousRatio)
      return;
    previousWidth = width;
    previousHeight = height;
    previousRatio = pixelRatio;
    camera.aspect = width / height;
    renderer.setDrawingBufferSize(width, height, pixelRatio);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    onResize();
  };
  function scheduleResize() {
    if (!pending) pending = requestAnimationFrame(resize);
  }
  const observer = new ResizeObserver(scheduleResize);
  observer.observe(container);
  compact.addEventListener("change", scheduleResize);
  window.addEventListener("resize", scheduleResize);
}
