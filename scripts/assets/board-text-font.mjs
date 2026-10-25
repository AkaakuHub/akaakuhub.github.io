import { writeFile } from "node:fs/promises";
import { boardText } from "../../src/content/board-text.ts";

const url = new URL("https://fonts.googleapis.com/css2");
url.search = new URLSearchParams({
  family: "Zen Maru Gothic:wght@500",
  text: boardText,
  display: "swap",
}).toString();
const response = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
});
if (!response.ok) throw new Error(`Google Fonts: HTTP ${response.status}`);
const css = await response.text();
const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
if (!match) throw new Error("掲示のフォントを取得できません。");
const font = await fetch(match[1]);
if (!font.ok) throw new Error(`Font: HTTP ${font.status}`);
const bytes = new Uint8Array(await font.arrayBuffer());
await writeFile("src/assets/fonts/zen-maru-gothic/board.woff2", bytes);
await writeFile(
  "src/assets/fonts/board-text.css",
  css
    .replace("font-family: 'Zen Maru Gothic'", "font-family: 'Zen Maru Gothic Board'")
    .replace(match[1], "/src/assets/fonts/zen-maru-gothic/board.woff2"),
);
console.log(`Board font: ${bytes.length} bytes`);
