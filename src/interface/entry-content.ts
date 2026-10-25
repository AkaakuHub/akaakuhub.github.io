import type { SiteContent } from "../content/schema";

export function populateEntry(root: HTMLElement, content: SiteContent): void {
  const articles = root.querySelector<HTMLOListElement>("[data-entry-articles]");
  const repositories = root.querySelector<HTMLOListElement>("[data-entry-repositories]");
  if (!articles || !repositories) throw new Error("部室の入口が見つかりません。");
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  function item(url: string, title: string, caption: string): HTMLLIElement {
    const row = document.createElement("li");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const meta = document.createElement("span");
    meta.className = "entry-item-meta";
    meta.textContent = caption;
    const label = document.createElement("span");
    label.className = "entry-item-title";
    label.textContent = title;
    link.append(meta, label);
    row.append(link);
    return row;
  }
  articles.replaceChildren(
    ...content.articles.map((article) =>
      item(article.url, article.title, date.format(article.publishedAt)),
    ),
  );
  repositories.replaceChildren(
    ...content.repositories.map((repository) =>
      item(repository.url, repository.name, `${repository.stars} stars`),
    ),
  );
}
