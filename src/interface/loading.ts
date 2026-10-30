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
  root.setAttribute("aria-busy", "true");
  root.dataset.loading = "true";
  const state = createLoadingState();
  let retry: HTMLButtonElement | undefined;
  const showFailure = (): void => {
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
    readout.update(state.value);
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
      readout.update(1, () => {
        if (panel.classList.contains("loading-failed")) return;
        panel.classList.add("loading-complete");
        const finish = (): void => {
          panel.remove();
          root.setAttribute("aria-busy", "false");
          delete root.dataset.loading;
        };
        panel.addEventListener("animationend", (event) => {
          if (
            event.target === panel &&
            event.animationName === "loading-depart" &&
            panel.classList.contains("loading-complete")
          )
            finish();
        });
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
      });
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
