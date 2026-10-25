import { parseSiteContent } from "./schema";
import type { SiteContent } from "./schema";
import { recoveryReason } from "../interface/recovery";

export async function loadSiteContent(): Promise<SiteContent> {
  const response = await fetch("/api/content", {
    signal: AbortSignal.timeout(15_000),
    cache: recoveryReason() ? "reload" : "default",
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
