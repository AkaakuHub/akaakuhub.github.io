export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const label = root.querySelector<HTMLElement>("[data-loading-label]");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const retry = root.querySelector<HTMLButtonElement>("[data-loading-retry]");
  if (!panel || !label || !progress || !retry)
    throw new Error("読み込み状態の表示先が見つかりません。");
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  retry.onclick = () => location.reload();
  let materials = 0;
  let rendering = 0;
  const update = (): void => {
    const value = materials * 0.65 + rendering * 0.25;
    progress.max = 1;
    progress.value = value;
    root.style.setProperty("--loading-blur", `${14 * (1 - value)}px`);
  };
  return {
    stage(text: string) {
      label.textContent = text;
    },
    progress(text: string, completed: number, total: number) {
      if (
        !Number.isSafeInteger(completed) ||
        !Number.isSafeInteger(total) ||
        total < 1 ||
        completed < 0 ||
        completed > total
      )
        throw new Error("読み込みの進捗が不正です。");
      label.textContent = text;
      materials = completed / total;
      update();
    },
    rendering(completed: number, total: number) {
      rendering = completed / total;
      update();
    },
    complete() {
      root.setAttribute("aria-busy", "false");
      progress.value = 1;
      delete root.dataset.loading;
      root.style.setProperty("--loading-blur", "0px");
      panel.classList.add("loading-complete");
      panel.addEventListener("transitionend", () => panel.remove(), { once: true });
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) panel.remove();
    },
    fail(message: string) {
      root.setAttribute("aria-busy", "false");
      label.textContent = message;
      progress.hidden = true;
      label.classList.remove("sr-only");
      panel.classList.add("loading-error");
      retry.hidden = false;
    },
  };
}
