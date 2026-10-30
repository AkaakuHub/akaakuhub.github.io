export function createLoadingReadout(
  panel: HTMLElement,
  progress: HTMLProgressElement,
  percent: HTMLElement,
) {
  const worker = new Worker(new URL("./loading-painter.worker.ts", import.meta.url), {
    type: "module",
  });
  const canvas = document.createElement("canvas");
  const ratio = window.devicePixelRatio;
  canvas.width = Math.round(280 * ratio);
  canvas.height = Math.round(80 * ratio);
  canvas.style.width = "280px";
  canvas.style.height = "80px";
  canvas.setAttribute("aria-hidden", "true");
  const style = getComputedStyle(percent);
  const surface = canvas.transferControlToOffscreen();
  worker.postMessage(
    {
      type: "setup",
      canvas: surface,
      ratio,
      size: Number.parseFloat(style.fontSize),
      ink: style.color,
    },
    [surface],
  );
  percent.replaceChildren(canvas);
  function paint(value: number): void {
    progress.value = value;
    panel.style.setProperty("--load-progress", String(value));
    worker.postMessage({ type: "progress", value });
  }
  return {
    update: paint,
    complete(): void {
      paint(1);
      panel.addEventListener("animationend", () => worker.terminate(), { once: true });
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) worker.terminate();
    },
    stop(): void {
      worker.terminate();
    },
  };
}
