export interface Repository {
  name: string;
  url: string;
  description: string | null;
  updatedAt: number;
}

export interface Article {
  title: string;
  url: string;
  publishedAt: number;
  thumbnail: string;
}

export interface SiteContent {
  repositories: readonly Repository[];
  articles: readonly Article[];
}

export type ContentState =
  | { status: "loading" | "error" }
  | { status: "ready"; content: SiteContent };

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
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("GitHubリポジトリの件数が不正です。");
  return value.map((entry: unknown) => {
    const repository = contentRecord(entry);
    const updatedAt = repository.updatedAt;
    if (typeof updatedAt !== "number" || !Number.isSafeInteger(updatedAt) || updatedAt < 0)
      throw new Error("GitHubの更新日時が不正です。");
    return {
      name: contentText(repository.name),
      url: link(repository.url, "https://github.com", "/AkaakuHub/"),
      description: repository.description === null ? null : contentText(repository.description),
      updatedAt,
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
      thumbnail: link(article.thumbnail, "https://blog.akaaku.net", "/og/posts/"),
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
