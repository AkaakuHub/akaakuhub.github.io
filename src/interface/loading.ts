export function createLoading(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>(".loading");
  const label = root.querySelector<HTMLElement>("[data-loading-label]");
  const value = root.querySelector<HTMLOutputElement>("[data-loading-value]");
  const progress = root.querySelector<HTMLProgressElement>("[data-loading-progress]");
  const retry = root.querySelector<HTMLButtonElement>("[data-loading-retry]");
  if (!panel || !label || !value || !progress || !retry)
    throw new Error("読み込み状態の表示先が見つかりません。");
  root.setAttribute("aria-busy", "true");
  retry.onclick = () => location.reload();
  return {
    stage(text: string) {
      label.textContent = text;
      progress.removeAttribute("value");
      value.textContent = "";
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
      progress.max = total;
      progress.value = completed;
      value.textContent = `${Math.floor((completed / total) * 100)}%`;
    },
    complete() {
      root.setAttribute("aria-busy", "false");
      panel.remove();
    },
    fail(message: string) {
      root.setAttribute("aria-busy", "false");
      label.textContent = message;
      progress.hidden = true;
      value.hidden = true;
      retry.hidden = false;
    },
  };
}
