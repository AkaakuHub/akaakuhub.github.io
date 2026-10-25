import { lexer } from "marked";
import { contentRecord } from "../../src/content/schema";

function plainText(value: unknown): string {
  const token = contentRecord(value);
  if (token.type === "image" || token.type === "html") return "";
  if (Array.isArray(token.tokens)) return token.tokens.map(plainText).join("");
  return typeof token.text === "string" ? token.text : "";
}

export function readmeExcerpt(markdown: string): string {
  const paragraphs: string[] = [];
  for (const token of lexer(markdown)) {
    if (token.type !== "paragraph") continue;
    const text = plainText(token).replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
    if (paragraphs.join("\n\n").length >= 1200) break;
  }
  return paragraphs.join("\n\n").slice(0, 1200);
}
