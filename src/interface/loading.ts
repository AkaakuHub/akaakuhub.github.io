import { RotateCw, createElement } from "lucide";
import { createLoadingState } from "./loading-state";
import { createLoadingReadout } from "./loading-readout";

export type Loading = ReturnType<typeof createLoading>;

export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const percent = root.querySelector<HTMLElement>("[data-loading-percent]");
  if (!panel || !progress || !percent) throw new Error("読み込み状態の表示先が見つかりません。");
  const readout = createLoadingReadout(panel, progress, percent);
  const startedAt = performance.now();
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  const state = createLoadingState();
  let retry: HTMLButtonElement | undefined;
  const showFailure = (error: unknown): void => {
    if (retry) return;
    readout.stop();
    retry = document.createElement("button");
    retry.type = "button";
    retry.className = "loading-retry";
    retry.append(
      createElement(RotateCw, {
        width: 40,
        height: 40,
        "stroke-width": 1,
        "aria-hidden": "true",
      }),
    );
    retry.append("再読み込み");
    retry.addEventListener("click", (event) => {
      if (event.isTrusted) location.reload();
    });
    const center = panel.querySelector(".loading-center");
    if (!center) throw new Error("再読み込みボタンの表示先が見つかりません。");
    const message = document.createElement("p");
    message.className = "loading-error";
    message.textContent = error instanceof Error ? error.message : String(error);
    center.replaceChildren(message, retry);
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
    readout.update(state.value);
  };
  return {
    ready: readout.ready,
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
      readout.complete();
      root.setAttribute("aria-busy", "false");
      delete root.dataset.loading;
      const duration = Math.min(180, (performance.now() - startedAt) * 0.04);
      panel.style.setProperty("--load-exit-duration", `${duration}ms`);
      panel.classList.add("loading-complete");
      panel.addEventListener("animationend", (event) => {
        if (event.target === panel && event.animationName === "loading-depart") panel.remove();
      });
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || duration === 0) panel.remove();
    },
    recover(error: unknown): void {
      console.error(error);
      state.fail();
      showFailure(error);
    },
    fail(error: unknown): void {
      console.error(error);
      if (!state.fail()) return;
      showFailure(error);
    },
  };
}
