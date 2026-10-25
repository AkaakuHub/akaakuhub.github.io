import { ArrowUpRight, Star, createElement } from "lucide";
import type { BoardState } from "../../scene/board/notices";

export function renderRepositories(container: HTMLElement, state: BoardState): void {
  container.replaceChildren();
  if (state.status !== "ready") {
    const status = document.createElement("p");
    status.className = "repository-status";
    status.textContent =
      state.status === "loading"
        ? "リポジトリを読み込んでいます"
        : "リポジトリを取得できませんでした。右上の更新から読み直してください。";
    container.append(status);
    return;
  }
  if (state.content.repositories.length === 0) {
    const status = document.createElement("p");
    status.className = "repository-status";
    status.textContent = "公開リポジトリはありません。";
    container.append(status);
    return;
  }
  for (const repository of state.content.repositories) {
    const item = document.createElement("a");
    item.className = "repository";
    item.href = repository.url;
    item.target = "_blank";
    item.rel = "noopener noreferrer";
    const title = document.createElement("h3");
    title.textContent = repository.name;
    const arrow = createElement(ArrowUpRight, { "aria-hidden": "true" });
    title.append(arrow);
    item.append(title);
    if (repository.description) {
      const description = document.createElement("p");
      description.textContent = repository.description;
      item.append(description);
    }
    const stars = document.createElement("span");
    stars.className = "repository-stars";
    stars.setAttribute("aria-label", `${repository.stars}スター`);
    stars.append(
      createElement(Star, { "aria-hidden": "true" }),
      document.createTextNode(repository.stars.toLocaleString("ja-JP")),
    );
    item.append(stars);
    container.append(item);
  }
}
