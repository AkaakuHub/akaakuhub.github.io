import { showLoadingFailure } from "./loading-failure";
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
  let failed = false;
  const showFailure = (error: unknown): void => {
    if (failed) return;
    failed = true;
    readout.stop();
    showLoadingFailure(panel, error);
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
