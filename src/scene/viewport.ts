import type { PerspectiveCamera } from "three";
import type { RoomRenderer } from "./rendering/room-renderer";
import type { createRendering } from "./rendering";
import { renderingSize } from "./rendering/resolution";

export function observeViewport(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  renderer: RoomRenderer,
  composer: Awaited<ReturnType<typeof createRendering>>,
  onResize: () => void,
): () => void {
  const container = canvas.parentElement;
  if (!container) throw new Error("部屋の表示領域が見つかりません。");
  const compact = window.matchMedia("(pointer: coarse)");
  let pending = 0;
  let previousWidth = 0;
  let previousHeight = 0;
  let previousRatio = 0;
  let bufferWidth = 0;
  let bufferHeight = 0;
  const resize = () => {
    pending = 0;
    const { width, height } = container.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const pixelRatio = window.devicePixelRatio;
    if (width === previousWidth && height === previousHeight && pixelRatio === previousRatio)
      return;
    previousWidth = width;
    previousHeight = height;
    previousRatio = pixelRatio;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const size = renderingSize(width, height, pixelRatio, renderer.profile);
    if (size.width !== bufferWidth || size.height !== bufferHeight) {
      bufferWidth = size.width;
      bufferHeight = size.height;
      renderer.setDrawingBufferSize(size.width, size.height, 1);
      composer.setSize(size.width, size.height);
    }
    onResize();
  };
  function scheduleResize() {
    if (!pending) pending = requestAnimationFrame(resize);
  }
  resize();
  return () => {
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(container);
    compact.addEventListener("change", scheduleResize);
    window.addEventListener("resize", scheduleResize);
    scheduleResize();
  };
}
