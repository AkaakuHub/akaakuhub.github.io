import { mkdir, writeFile } from "node:fs/promises";

const url = new URL("https://fonts.googleapis.com/css2");
url.search = new URLSearchParams({
  family: "Yomogi",
  text: "最新記事",
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
if (!match) throw new Error("見出しのフォントを取得できません。");
const font = await fetch(match[1]);
const license = await fetch(
  "https://raw.githubusercontent.com/google/fonts/main/ofl/yomogi/OFL.txt",
);
if (!font.ok || !license.ok) throw new Error("見出しのフォントを保存できません。");
await mkdir("src/assets/fonts/yomogi", { recursive: true });
await writeFile("src/assets/fonts/yomogi/heading.woff2", new Uint8Array(await font.arrayBuffer()));
await writeFile(
  "src/assets/fonts/yomogi.css",
  css.replace(match[1], "/src/assets/fonts/yomogi/heading.woff2"),
);
await writeFile("public/fonts/yomogi-OFL.txt", await license.text());
