import { finishRecovery, reloadEverything, retryAvailableAt, retryDelay } from "./recovery";

export type Loading = ReturnType<typeof createLoading>;

export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const percent = root.querySelector<HTMLElement>("[data-loading-percent]");
  if (!panel || !progress || !percent) throw new Error("読み込み状態の表示先が見つかりません。");
  const digits = percent.querySelectorAll<HTMLElement>("[data-loading-digit]");
  if (digits.length !== 3) throw new Error("進捗の桁が揃っていません。");
  function setPercent(value: number): void {
    const text = String(value).padStart(3, " ");
    digits.forEach((digit, index) => {
      digit.textContent = text.charAt(index);
    });
  }
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  let failed = false;
  let materials = 0;
  let rendering = 0;
  let restarting = false;
  const schedule = (): void => {
    const delay = Math.max(retryDelay(), retryAvailableAt() - Date.now());
    setTimeout(() => void restart(), delay);
  };
  const restart = async (): Promise<void> => {
    if (restarting) return;
    restarting = true;
    try {
      if (!(await reloadEverything())) {
        restarting = false;
        schedule();
      }
    } catch (error) {
      console.error(error);
      restarting = false;
      schedule();
    }
  };
  const update = (): void => {
    if (failed) return;
    const value = materials * 0.75 + rendering * 0.2;
    progress.value = value;
    panel.style.setProperty("--load-progress", String(value));
    setPercent(Math.round(value * 100));
  };
  return {
    progress(completed: number, total: number): void {
      if (
        !Number.isSafeInteger(completed) ||
        !Number.isSafeInteger(total) ||
        total < 1 ||
        completed < 0 ||
        completed > total
      )
        throw new Error("読み込みの進捗が不正です。");
      materials = completed / total;
      update();
    },
    rendering(completed: number, total: number): void {
      rendering = completed / total;
      update();
    },
    complete(): void {
      if (failed) return;
      finishRecovery();
      root.setAttribute("aria-busy", "false");
      progress.value = 1;
      setPercent(100);
      delete root.dataset.loading;
      panel.classList.add("loading-complete");
      panel.addEventListener(
        "transitionend",
        () => {
          if (panel.classList.contains("loading-complete")) panel.remove();
        },
        { once: true },
      );
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) panel.remove();
    },
    fail(error: unknown): void {
      console.error(error);
      if (failed) return;
      failed = true;
      if (!panel.isConnected) root.append(panel);
      panel.classList.remove("loading-complete");
      root.dataset.loading = "true";
      root.setAttribute("aria-busy", "true");
      materials = 0;
      rendering = 0;
      progress.value = 0;
      panel.style.setProperty("--load-progress", "0");
      setPercent(0);
      schedule();
    },
  };
}
