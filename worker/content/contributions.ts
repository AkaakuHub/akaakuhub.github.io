import { XMLValidator } from "fast-xml-parser";

export async function fetchContributions(): Promise<string> {
  const response = await fetch(
    "https://raw.githubusercontent.com/AkaakuHub/github-grass/refs/heads/main/github-glass.svg",
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) throw new Error(`GitHubの記録を取得できませんでした: HTTP ${response.status}`);
  const source = await response.text();
  if (source.length > 300_000 || XMLValidator.validate(source) !== true)
    throw new Error("GitHubのSVGの形式が不正です。");
  return source;
}

export function contributionImage(source: string): Response {
  return new Response(source, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
