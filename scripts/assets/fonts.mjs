import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const response = await fetch(
  "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500&display=swap",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  },
);
if (!response.ok) throw new Error(`Google Fonts: HTTP ${response.status}`);
let css = await response.text();
const urls = [
  ...new Set(
    [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map(
      (match) => match[1],
    ),
  ),
];
if (urls.length === 0 || !css.includes("unicode-range:"))
  throw new Error("分割されたWOFF2フォントを取得できません。");
const directory = "src/assets/fonts/zen-maru-gothic";
await mkdir(directory, { recursive: true });
for (let index = 0; index < urls.length; index += 6) {
  await Promise.all(
    urls.slice(index, index + 6).map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`フォントの取得に失敗しました: HTTP ${response.status}`);
      await writeFile(
        `${directory}/${basename(new URL(url).pathname)}`,
        new Uint8Array(await response.arrayBuffer()),
      );
    }),
  );
}
for (const url of urls)
  css = css.replaceAll(url, `/src/assets/fonts/zen-maru-gothic/${basename(new URL(url).pathname)}`);
await writeFile("src/assets/fonts/zen-maru-gothic.css", css);
const license = await fetch(
  "https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/OFL.txt",
);
if (!license.ok) throw new Error(`フォントのライセンスを取得できません: HTTP ${license.status}`);
await mkdir("public/fonts", { recursive: true });
await writeFile("public/fonts/OFL.txt", await license.text());
console.log(`Zen Maru Gothic: ${urls.length} WOFF2 chunks`);
