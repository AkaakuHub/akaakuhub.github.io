export interface PaperLink {
  label: string;
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function paperLinkAt(
  links: readonly PaperLink[],
  uv: { x: number; y: number } | undefined,
): PaperLink | undefined {
  if (!uv) return;
  const y = 1 - uv.y;
  return links.find(
    (link) =>
      uv.x >= link.x && uv.x <= link.x + link.width && y >= link.y && y <= link.y + link.height,
  );
}
