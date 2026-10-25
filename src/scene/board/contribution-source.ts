import { Texture, SRGBColorSpace } from "three";

interface ContributionCell {
  x: number;
  y: number;
  width: number;
  height: number;
  begin: number;
  duration: number;
}

async function texture(svg: Element): Promise<Texture> {
  svg.setAttribute("width", "968");
  svg.setAttribute("height", "344");
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const map = new Texture(image);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return map;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function number(element: Element, attribute: string): number {
  const value = element.getAttribute(attribute);
  if (value === null || !Number.isFinite(Number(value)))
    throw new Error(`GitHubのSVGの${attribute}が不正です。`);
  return Number(value);
}

function seconds(element: Element, attribute: string): number {
  const value = element.getAttribute(attribute);
  if (!value || !/^\d+(?:\.\d+)?s$/.test(value))
    throw new Error(`GitHubのアニメーションの${attribute}が不正です。`);
  return Number(value.slice(0, -1));
}

export async function loadContributionSource() {
  const response = await fetch(
    "https://raw.githubusercontent.com/AkaakuHub/github-grass/refs/heads/main/github-glass.svg",
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) throw new Error(`GitHubのSVGを取得できませんでした: HTTP ${response.status}`);
  const source = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  const root = source.documentElement;
  if (root.localName !== "svg" || source.querySelector("parsererror"))
    throw new Error("GitHubのSVGの形式が不正です。");
  const viewBox = root
    .getAttribute("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);
  const width = viewBox?.[2];
  const height = viewBox?.[3];
  if (!width || !height || width <= 0 || height <= 0)
    throw new Error("GitHubのSVGの寸法が不正です。");
  const cells: ContributionCell[] = [];
  for (const element of root.querySelectorAll(":scope > rect")) {
    const animation = element.querySelector("animate");
    if (!animation) continue;
    cells.push({
      x: number(element, "x"),
      y: number(element, "y"),
      width: number(element, "width"),
      height: number(element, "height"),
      begin: seconds(animation, "begin"),
      duration: seconds(animation, "dur"),
    });
  }
  if (cells.length === 0) throw new Error("GitHubのSVGに草がありません。");
  const animated = root.cloneNode(true);
  const still = root.cloneNode(true);
  if (!(animated instanceof Element) || !(still instanceof Element))
    throw new Error("GitHubのSVGを取り込めませんでした。");
  for (const child of animated.querySelectorAll(":scope > *")) {
    if (!child.querySelector("animate")) child.remove();
    else {
      child.setAttribute("opacity", "1");
      child.querySelectorAll("animate").forEach((animation) => animation.remove());
    }
  }
  for (const child of still.querySelectorAll(":scope > *")) {
    if (child.querySelector("animate")) child.remove();
  }
  const [animatedMap, stillMap] = await Promise.all([texture(animated), texture(still)]);
  return { width, height, cells, animatedMap, stillMap };
}
