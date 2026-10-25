export interface ContributionImage {
  source: Blob;
  width: number;
  height: number;
}

export type ContributionState =
  | { status: "loading" | "error" }
  | { status: "ready"; image: ContributionImage };

export async function loadContributions(signal: AbortSignal): Promise<ContributionImage> {
  const response = await fetch("/api/contributions", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHubの記録を取得できませんでした: HTTP ${response.status}`);
  const source = await response.text();
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  const dimensions = root
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = dimensions?.[2];
  const height = dimensions?.[3];
  if (
    root.localName !== "svg" ||
    document.querySelector("parsererror") ||
    !width ||
    !height ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 1000 ||
    height > 1000
  )
    throw new Error("GitHubのSVGの形式が不正です。");
  return { source: new Blob([source], { type: "image/svg+xml" }), width, height };
}
