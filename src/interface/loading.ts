import { RotateCw, createElement } from "lucide";
import { createLoadingState } from "./loading-state";

export type Loading = ReturnType<typeof createLoading>;

export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const percent = root.querySelector<HTMLElement>("[data-loading-percent]");
  if (!panel || !progress || !percent) throw new Error("読み込み状態の表示先が見つかりません。");
  const digits = percent.querySelectorAll<HTMLElement>("[data-loading-digit]");
  if (digits.length !== 6) throw new Error("進捗の桁が揃っていません。");
  function setPercent(value: number): void {
    const text = value.toFixed(2).padStart(6, " ");
    digits.forEach((digit, index) => {
      digit.textContent = text.charAt(index);
    });
  }
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  const state = createLoadingState();
  let retry: HTMLButtonElement | undefined;
  const showFailure = (): void => {
    if (retry) return;
    retry = document.createElement("button");
    retry.type = "button";
    retry.className = "loading-retry";
    retry.append(createElement(RotateCw, { width: 24, height: 24, "aria-hidden": "true" }));
    retry.append("再読み込み");
    retry.addEventListener("click", (event) => {
      if (event.isTrusted) location.reload();
    });
    percent.replaceWith(retry);
    panel.classList.remove("loading-complete");
    panel.classList.add("loading-failed");
    panel.setAttribute("role", "alert");
    panel.setAttribute("aria-label", "部屋を表示できませんでした");
    root.setAttribute("aria-busy", "false");
    delete root.dataset.loading;
    if (!panel.isConnected) root.append(panel);
  };
  const update = (): void => {
    if (state.status !== "loading") return;
    const value = state.value;
    progress.value = value;
    panel.style.setProperty("--load-progress", String(value));
    setPercent(value * 100);
  };
  return {
    progress(completed: number, total: number): void {
      state.advance("materials", completed, total);
      update();
    },
    rendering(completed: number, total: number): void {
      state.advance("rendering", completed, total);
      update();
    },
    complete(): void {
      if (state.status !== "loading") return;
      state.complete();
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
    recover(error: unknown): void {
      console.error(error);
      state.fail();
      showFailure();
    },
    fail(error: unknown): void {
      console.error(error);
      if (!state.fail()) return;
      showFailure();
    },
  };
}
