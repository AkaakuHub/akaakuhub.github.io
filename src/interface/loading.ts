import { errorDetails, finishRecovery, recoveryReason, reloadEverything } from "./recovery";

export type Loading = ReturnType<typeof createLoading>;

export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const label = root.querySelector<HTMLElement>("[data-loading-label]");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const percent = root.querySelector<HTMLElement>("[data-loading-percent]");
  const errorPanel = root.querySelector<HTMLElement>("[data-loading-failure]");
  const details = root.querySelector<HTMLElement>("[data-loading-error]");
  const recovery = root.querySelector<HTMLElement>("[data-loading-recovery]");
  const retry = root.querySelector<HTMLButtonElement>("[data-loading-retry]");
  if (!panel || !label || !progress || !percent || !errorPanel || !details || !retry || !recovery)
    throw new Error("読み込み状態の表示先が見つかりません。");
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  const previous = recoveryReason();
  if (previous) {
    recovery.hidden = false;
    recovery.textContent = `前回のエラーを受け、すべて取得し直しています。\n${previous}`;
  }
  let failed = false;
  let materials = 0;
  let rendering = 0;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  let restarting = false;
  const restart = async (reason: string): Promise<void> => {
    if (restarting) return;
    restarting = true;
    retry.disabled = true;
    try {
      await reloadEverything(reason);
    } catch (error) {
      details.textContent = `${reason}\n\n再取得を開始できませんでした。\n${errorDetails(error)}`;
      label.textContent = "接続を確認してから、取得し直してください";
      retry.disabled = false;
      restarting = false;
    }
  };
  retry.onclick = () => {
    clearTimeout(reloadTimer);
    void restart(details.textContent);
  };
  const update = (): void => {
    if (failed) return;
    const value = materials * 0.75 + rendering * 0.2;
    progress.value = value;
    panel.style.setProperty("--load-progress", String(value));
    percent.textContent = `${Math.round(value * 100)
      .toString()
      .padStart(2, "0")}%`;
  };
  return {
    stage(text: string): void {
      if (!failed) label.textContent = text;
      panel.dataset.phase = materials < 0.75 ? "space" : "light";
    },
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
      percent.textContent = "100%";
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
      if (failed) return;
      const message = errorDetails(error);
      details.textContent = message;
      failed = true;
      const repeated = recoveryReason() !== null;
      if (!panel.isConnected) root.append(panel);
      panel.classList.remove("loading-complete");
      root.dataset.loading = "true";
      root.setAttribute("aria-busy", "false");
      panel.classList.add("loading-error");
      errorPanel.hidden = false;
      progress.hidden = true;
      percent.hidden = true;
      label.textContent = repeated
        ? "再取得しても部室を開けませんでした"
        : "接続を確認して、すべて取得し直します";
      if (!repeated) reloadTimer = setTimeout(() => void restart(message), 2500);
    },
  };
}
