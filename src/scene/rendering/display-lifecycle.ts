export function observeDisplayVisibility(
  canvas: HTMLCanvasElement,
  update: (active: boolean) => void,
): () => void {
  let active = false;
  let release = 0;
  function suspend(): void {
    active = false;
    cancelAnimationFrame(release);
    release = 0;
    canvas.dataset.displayInactive = "";
    update(false);
  }
  function sync(): void {
    if (document.hidden || !document.hasFocus()) {
      suspend();
      return;
    }
    active = true;
    update(true);
  }
  canvas.dataset.displayInactive = "";
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("focus", sync);
  window.addEventListener("blur", suspend);
  window.addEventListener("pagehide", suspend);
  window.addEventListener("pageshow", sync);
  window.matchMedia("(dynamic-range: high)").addEventListener("change", sync);
  sync();
  return () => {
    if (!active || release || !canvas.hasAttribute("data-display-inactive")) return;
    release = requestAnimationFrame(() => {
      release = 0;
      if (active && !document.hidden && document.hasFocus()) delete canvas.dataset.displayInactive;
    });
  };
}
