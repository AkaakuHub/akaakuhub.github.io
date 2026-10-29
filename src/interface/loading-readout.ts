export function createLoadingReadout(
  panel: HTMLElement,
  progress: HTMLProgressElement,
  percent: HTMLElement,
) {
  const digits = percent.querySelectorAll<HTMLElement>("[data-loading-digit]");
  if (digits.length !== 6) throw new Error("進捗の桁が揃っていません。");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let displayed = 0;
  let target = 0;
  let frame = 0;
  let previous = 0;
  let settled: (() => void) | undefined;
  function paint(value: number): void {
    progress.value = value;
    panel.style.setProperty("--load-progress", String(value));
    const text = (value * 100).toFixed(2).padStart(6, " ");
    digits.forEach((digit, index) => {
      const character = text.charAt(index);
      digit.hidden = character === " ";
      const content = character === " " ? "0" : character;
      if (digit.textContent !== content) digit.textContent = content;
    });
  }
  function tick(time: number): void {
    const elapsed = Math.min(time - previous, 64);
    previous = time;
    displayed += (target - displayed) * (1 - Math.exp(-elapsed / 110));
    if (target - displayed < 0.00005) displayed = target;
    paint(displayed);
    if (displayed < target) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      const callback = settled;
      settled = undefined;
      callback?.();
    }
  }
  paint(0);
  return {
    update(value: number, onSettled?: () => void): void {
      target = value;
      settled = onSettled;
      if (reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        displayed = target;
        paint(target);
        settled = undefined;
        onSettled?.();
      } else if (!frame) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    stop(): void {
      cancelAnimationFrame(frame);
      frame = 0;
      settled = undefined;
    },
  };
}
