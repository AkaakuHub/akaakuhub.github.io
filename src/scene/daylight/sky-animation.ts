import type { createSky } from "./sky";
import type { createRendering } from "../rendering";
import type { illuminate } from "../lighting";

export function createSkyAnimation(
  sky: Awaited<ReturnType<typeof createSky>>,
  rendering: Pick<Awaited<ReturnType<typeof createRendering>>, "skyVisible" | "invalidate">,
  lighting: Pick<ReturnType<typeof illuminate>, "setCloudTransmission">,
  requestFrame: () => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let previous = performance.now();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function cancel(): void {
    clearTimeout(timer);
    timer = undefined;
    previous = performance.now();
  }

  function advance(now: number): boolean {
    const seconds = Math.min(1, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (reducedMotion.matches || !sky.moving) return false;
    sky.advance(seconds);
    const changed = lighting.setCloudTransmission(sky.transmission);
    if (changed) rendering.invalidate();
    return changed;
  }

  function schedule(): void {
    clearTimeout(timer);
    timer = undefined;
    if (document.hidden || reducedMotion.matches || !sky.moving) return;
    timer = setTimeout(
      () => {
        timer = undefined;
        if (document.hidden) return;
        const changed = advance(performance.now());
        if (rendering.skyVisible || changed) requestFrame();
        else schedule();
      },
      rendering.skyVisible ? 50 : 500,
    );
  }

  document.addEventListener("visibilitychange", cancel);
  window.addEventListener("pagehide", cancel);
  reducedMotion.addEventListener("change", () => {
    cancel();
    requestFrame();
  });
  return (now: number): void => {
    advance(now);
    schedule();
  };
}
