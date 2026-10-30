export function createLoadingReadout(
  panel: HTMLElement,
  progress: HTMLProgressElement,
  percent: HTMLElement,
) {
  const center = panel.querySelector<HTMLElement>(".loading-center");
  if (!center) throw new Error("読み込みアニメーションの表示先が見つかりません。");
  const worker = new Worker(new URL("./loading-painter.worker.ts", import.meta.url), {
    type: "module",
  });
  const canvas = document.createElement("canvas");
  const scale = center.getBoundingClientRect().width / 280;
  const ratio = window.devicePixelRatio * scale;
  canvas.width = Math.round(560 * ratio);
  canvas.height = Math.round(560 * ratio);
  canvas.style.position = "absolute";
  canvas.style.width = "200%";
  canvas.style.height = "200%";
  canvas.setAttribute("aria-hidden", "true");
  const style = getComputedStyle(percent);
  const surface = canvas.transferControlToOffscreen();
  const ready = new Promise<void>((resolve, reject) => {
    worker.onmessage = () => resolve();
    worker.onerror = (event) => reject(new Error(event.message));
    worker.onmessageerror = () => reject(new Error("読み込み表示を準備できませんでした。"));
  });
  worker.postMessage(
    {
      type: "setup",
      canvas: surface,
      ratio,
      size: Number.parseFloat(style.fontSize) / scale,
      ink: style.color,
      accent: getComputedStyle(panel).getPropertyValue("--loading-accent").trim(),
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    [surface],
  );
  center.replaceChildren(canvas);
  function paint(value: number): void {
    progress.value = value;
    worker.postMessage({ type: "progress", value });
  }
  return {
    ready,
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
