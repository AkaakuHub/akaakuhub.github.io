import { readmeExcerpt } from "./readme-excerpt";

export async function fetchReadme(name: string): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/AkaakuHub/${encodeURIComponent(name)}/readme`,
    {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "AkaakuHub-site", Accept: "application/vnd.github.raw+json" },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`READMEの取得に失敗しました: HTTP ${response.status}`);
  return readmeExcerpt(await response.text());
}
