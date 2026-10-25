import { XMLParser, XMLValidator } from "fast-xml-parser";
import { profile } from "../../src/content/profile";
import {
  contentRecord,
  contentText,
  parseArticles,
  parseRepositories,
} from "../../src/content/schema";

export async function fetchRepositories() {
  const url = new URL("https://api.github.com/search/repositories");
  url.search = new URLSearchParams({
    q: `user:${profile.handle} fork:true`,
    sort: "stars",
    order: "desc",
    per_page: "100",
  }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "AkaakuHub-site", Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHubの取得に失敗しました: HTTP ${response.status}`);
  const result = contentRecord(await response.json());
  if (!Array.isArray(result.items)) throw new Error("GitHubの検索結果を取得できませんでした。");
  const source = JSON.stringify({
    incomplete_results: result.incomplete_results,
    items: result.items.map((entry: unknown) => {
      const repository = contentRecord(entry);
      return {
        name: repository.name,
        html_url: repository.html_url,
        description: repository.description,
        stargazers_count: repository.stargazers_count,
      };
    }),
  });
  readRepositories(source);
  return source;
}

export function readRepositories(source: string) {
  const value: unknown = JSON.parse(source);
  const result = contentRecord(value);
  if (result.incomplete_results !== false || !Array.isArray(result.items))
    throw new Error("GitHubの検索結果を取得できませんでした。");
  return parseRepositories(
    result.items.map((item: unknown) => {
      const repository = contentRecord(item);
      return {
        name: repository.name,
        url: repository.html_url,
        description: repository.description === "" ? null : repository.description,
        stars: repository.stargazers_count,
      };
    }),
  );
}

export function readArticles(xml: string) {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) throw new Error(`RSSの形式が不正です: ${validation.err.msg}`);
  const parser = new XMLParser({
    parseTagValue: false,
    ignoreAttributes: false,
    isArray: (name, path) => name === "item" && path === "rss.channel.item",
  });
  const value: unknown = parser.parse(xml);
  const channel = contentRecord(contentRecord(contentRecord(value).rss).channel);
  if (!Array.isArray(channel.item)) throw new Error("RSSの記事一覧が見つかりません。");
  const articles = channel.item.map((entry: unknown) => {
    const item = contentRecord(entry);
    const thumbnail = contentRecord(item["media:thumbnail"]);
    return {
      title: contentText(item.title),
      url: contentText(item.link),
      publishedAt: Date.parse(contentText(item.pubDate)),
      thumbnail: contentText(thumbnail["@_url"]),
    };
  });
  articles.sort((a, b) => b.publishedAt - a.publishedAt);
  return parseArticles(articles.slice(0, 2));
}

export async function fetchArticles() {
  const response = await fetch("https://blog.akaaku.net/rss.xml", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`RSSの取得に失敗しました: HTTP ${response.status}`);
  const xml = await response.text();
  if (xml.length > 500_000) throw new Error("RSSのサイズが上限を超えています。");
  readArticles(xml);
  return xml;
}
