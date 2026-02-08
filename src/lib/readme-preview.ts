function stripCodeFences(lines: string[]): string[] {
  const out: string[] = [];
  let inFence = false;

  for (const raw of lines) {
    const line = raw;
    const trimmed = line.trimStart();

    const isFence = trimmed.startsWith("```") || trimmed.startsWith("~~~");

    if (isFence) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;
    out.push(line);
  }

  return out;
}

function stripFrontmatter(lines: string[]): string[] {
  if (lines.length < 3) return lines;
  if (lines[0].trim() !== "---") return lines;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return lines.slice(i + 1);
  }

  return lines;
}

function normalizeMarkdownLine(input: string): string {
  let s = input.trim();
  if (!s) return "";

  // Basic markdown cleanup for previews (best-effort).
  if (s.startsWith(">")) s = s.replace(/^>\s?/, "");
  s = s.replace(/^#{1,6}\s+/, "");
  s = s.replace(/^[-*+]\s+/, "");
  s = s.replace(/^\d+\.\s+/, "");

  // Images: ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // Links: [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Inline code: `code` -> code
  s = s.replace(/`([^`]+)`/g, "$1");

  // Remove emphasis markers.
  s = s.replace(/[*_]{1,3}/g, "");

  // Collapse whitespace.
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function truncateWithEllipsis(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, Math.max(0, maxChars - 1)).trimEnd();
  return `${sliced}…`;
}

export function readmeToPreviewText(
  markdown: string,
  maxChars: number,
): string | null {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const rawLines = normalized.split("\n");
  const noFrontmatter = stripFrontmatter(rawLines);
  const noCode = stripCodeFences(noFrontmatter);

  const cleanedLines: string[] = [];
  for (const line of noCode) {
    // Drop HTML comments entirely.
    if (line.trimStart().startsWith("<!--")) continue;
    const cleaned = normalizeMarkdownLine(line);
    if (!cleaned) continue;
    cleanedLines.push(truncateWithEllipsis(cleaned, 160));
    if (cleanedLines.length >= 8) break; // enough for a short preview
  }

  const joined = cleanedLines.join("\n");
  const trimmed = joined.trim();
  if (!trimmed) return null;
  return truncateWithEllipsis(trimmed, maxChars);
}
