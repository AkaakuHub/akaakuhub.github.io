export function createLoadingReadout(
  panel: HTMLElement,
  progress: HTMLProgressElement,
  percent: HTMLElement,
) {
  const digits = percent.querySelectorAll<HTMLElement>("[data-loading-digit]");
  if (digits.length !== 6) throw new Error("進捗の桁が揃っていません。");
  let target = 0;
  let frame = 0;
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
  paint(0);
  return {
    update(value: number): void {
      target = value;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          paint(target);
        });
    },
    complete(): void {
      cancelAnimationFrame(frame);
      frame = 0;
      paint(1);
    },
    stop(): void {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
