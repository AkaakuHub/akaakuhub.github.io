import { parseSiteContent } from "./schema";
import type { SiteContent } from "./schema";

export async function loadSiteContent(signal: AbortSignal): Promise<SiteContent> {
  const response = await fetch("/api/content", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    cache: "no-store",
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    if (
      typeof value === "object" &&
      value !== null &&
      "error" in value &&
      typeof value.error === "string"
    )
      throw new Error(value.error);
    throw new Error(`公開情報を取得できませんでした: HTTP ${response.status}`);
  }
  return parseSiteContent(value);
}

export async function revokeSiteContent(signal: AbortSignal): Promise<void> {
  const response = await fetch("/api/reload", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  });
  if (!response.ok) throw new Error(`キャッシュを失効できませんでした: HTTP ${response.status}`);
}
