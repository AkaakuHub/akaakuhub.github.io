import { Copy, RotateCw, createElement } from "lucide";
import { renderingDiagnostics } from "../scene/rendering/session";

export function showLoadingFailure(panel: HTMLElement, error: unknown): void {
  const center = panel.querySelector(".loading-center");
  if (!center) throw new Error("エラーの表示先が見つかりません。");
  const report = (): string =>
    [
      renderingDiagnostics.report() ||
        (error instanceof Error ? (error.stack ?? error.message) : String(error)),
      `URL: ${location.origin}${location.pathname}`,
      `Browser: ${navigator.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n\n");
  const title = document.createElement("p");
  title.className = "loading-error";
  title.textContent = "部室を表示できませんでした";
  const actions = document.createElement("div");
  actions.className = "loading-actions";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "loading-retry";
  retry.append(
    createElement(RotateCw, { width: 24, height: 24, "aria-hidden": "true" }),
    "再読み込み",
  );
  retry.addEventListener("click", () => location.reload());
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "loading-copy";
  const label = document.createElement("span");
  label.textContent = "エラーをコピー";
  copy.append(createElement(Copy, { width: 24, height: 24, "aria-hidden": "true" }), label);
  const details = document.createElement("details");
  details.className = "loading-details";
  const summary = document.createElement("summary");
  summary.textContent = "エラーの詳細";
  const content = document.createElement("pre");
  content.textContent = report();
  details.append(summary, content);
  details.addEventListener("toggle", () => {
    if (details.open) content.textContent = report();
  });
  async function copyError(): Promise<void> {
    copy.disabled = true;
    try {
      await navigator.clipboard.writeText(report());
      label.textContent = "コピーしました";
    } catch {
      label.textContent = "コピーできませんでした";
      details.open = true;
    } finally {
      copy.disabled = false;
    }
  }
  copy.addEventListener("click", () => {
    void copyError();
  });
  actions.append(retry, copy);
  center.replaceChildren(title, actions, details);
  panel.classList.remove("loading-complete");
  panel.classList.add("loading-failed");
  panel.setAttribute("role", "alert");
  panel.setAttribute("aria-label", title.textContent);
}
