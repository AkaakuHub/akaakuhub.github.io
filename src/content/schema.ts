export interface Repository {
  name: string;
  url: string;
  description: string | null;
  stars: number;
}

export interface Article {
  title: string;
  url: string;
  publishedAt: number;
}

export interface SiteContent {
  repositories: readonly Repository[];
  articles: readonly Article[];
}

export function contentRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("公開情報の形式が不正です。");
  return value as Record<string, unknown>;
}

export function contentText(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000)
    throw new Error("公開情報の文字列が不正です。");
  return value;
}

function link(value: unknown, origin: string, prefix: string): string {
  const url = new URL(contentText(value));
  if (url.origin !== origin || !url.pathname.startsWith(prefix) || url.username || url.password)
    throw new Error("公開情報のリンク先が不正です。");
  return url.href;
}

export function parseRepositories(value: unknown): Repository[] {
  if (!Array.isArray(value) || value.length > 3)
    throw new Error("GitHubリポジトリの件数が不正です。");
  return value.map((entry: unknown) => {
    const repository = contentRecord(entry);
    const stars = repository.stars;
    if (typeof stars !== "number" || !Number.isSafeInteger(stars) || stars < 0)
      throw new Error("GitHubのスター数が不正です。");
    return {
      name: contentText(repository.name),
      url: link(repository.url, "https://github.com", "/AkaakuHub/"),
      description: repository.description === null ? null : contentText(repository.description),
      stars,
    };
  });
}

export function parseArticles(value: unknown): Article[] {
  if (!Array.isArray(value) || value.length > 2) throw new Error("記事の件数が不正です。");
  return value.map((entry: unknown) => {
    const article = contentRecord(entry);
    const publishedAt = article.publishedAt;
    if (typeof publishedAt !== "number" || !Number.isSafeInteger(publishedAt) || publishedAt < 0)
      throw new Error("記事の公開日が不正です。");
    return {
      title: contentText(article.title),
      url: link(article.url, "https://blog.akaaku.net", "/posts/"),
      publishedAt,
    };
  });
}

export function parseSiteContent(value: unknown): SiteContent {
  const record = contentRecord(value);
  return {
    repositories: parseRepositories(record.repositories),
    articles: parseArticles(record.articles),
  };
}
