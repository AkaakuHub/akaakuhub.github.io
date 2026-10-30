export function observeDisplayVisibility(update: (active: boolean) => void): void {
  function sync(): void {
    update(!document.hidden && document.hasFocus());
  }
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("focus", sync);
  window.addEventListener("blur", () => update(false));
  window.addEventListener("pagehide", () => update(false));
  window.addEventListener("pageshow", sync);
  window.matchMedia("(dynamic-range: high)").addEventListener("change", sync);
  sync();
}
