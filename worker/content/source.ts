import { XMLParser, XMLValidator } from "fast-xml-parser";
import { contentRecord, contentText, parseArticles } from "../../src/content/schema";

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
