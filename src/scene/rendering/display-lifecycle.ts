export function observeDisplayVisibility(update: (active: boolean) => void): void {
  let resume = 0;
  function suspend(): void {
    cancelAnimationFrame(resume);
    resume = 0;
    update(false);
  }
  function sync(): void {
    if (document.hidden) {
      suspend();
      return;
    }
    cancelAnimationFrame(resume);
    resume = requestAnimationFrame(() => {
      resume = requestAnimationFrame(() => {
        resume = 0;
        if (!document.hidden) update(true);
      });
    });
  }
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", suspend);
  window.addEventListener("pageshow", sync);
  window.matchMedia("(dynamic-range: high)").addEventListener("change", sync);
  sync();
}
