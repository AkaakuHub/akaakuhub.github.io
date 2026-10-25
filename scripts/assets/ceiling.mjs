import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const sourceFile = process.argv[2];
if (!sourceFile) throw new Error("天井材の元画像を指定してください。");
const source = await readFile(sourceFile);
const directory = "src/assets/materials/school_ceiling";
await mkdir(directory, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const colorSize = 512;
const color = await sharp(source).resize(colorSize, colorSize).removeAlpha().raw().toBuffer();
for (let y = 0; y < colorSize; y++) {
  for (let x = 0; x < colorSize; x++) {
    const joint = Math.min(x, colorSize - 1 - x, y % 256, 255 - (y % 256)) === 0;
    if (!joint) continue;
    for (let channel = 0; channel < 3; channel++) {
      const index = (y * colorSize + x) * 3 + channel;
      color[index] = Math.round(color[index] * 0.94);
    }
  }
}
const colorImage = sharp(color, { raw: { width: colorSize, height: colorSize, channels: 3 } });
const normalSize = 256;
const height = await colorImage.clone().resize(normalSize, normalSize).grayscale().raw().toBuffer();
const normal = Buffer.alloc(normalSize * normalSize * 3);
const heightAt = (x, y) =>
  height[((y + normalSize) % normalSize) * normalSize + ((x + normalSize) % normalSize)] / 255;
for (let y = 0; y < normalSize; y++) {
  for (let x = 0; x < normalSize; x++) {
    const dx = (heightAt(x - 1, y) - heightAt(x + 1, y)) * 1.4;
    const dy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * 1.4;
    const length = Math.hypot(dx, dy, 1);
    const index = (y * normalSize + x) * 3;
    normal[index] = Math.round(((dx / length) * 0.5 + 0.5) * 255);
    normal[index + 1] = Math.round(((dy / length) * 0.5 + 0.5) * 255);
    normal[index + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
  }
}
const images = [
  ["color", colorSize, await colorImage.webp({ quality: 85, smartSubsample: true }).toBuffer()],
  [
    "normal",
    normalSize,
    await sharp(normal, { raw: { width: normalSize, height: normalSize, channels: 3 } })
      .webp({ quality: 90, smartSubsample: true })
      .toBuffer(),
  ],
  [
    "roughness",
    128,
    await colorImage
      .clone()
      .resize(128, 128)
      .grayscale()
      .linear(-0.12, 255)
      .webp({ lossless: true })
      .toBuffer(),
  ],
];
const maps = {};
for (const [name, size, bytes] of images) {
  const file = `${directory}/${name}.webp`;
  await writeFile(file, bytes);
  maps[name] = { file, sha256: hash(bytes), dimensions: [size, size] };
  console.log(`${name}: ${bytes.length} bytes`);
}
const attributionFile = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(attributionFile, "utf8"));
const entry = {
  id: "school_ceiling",
  name: "学校の岩綿吸音板を参考にした天井材",
  provider: "OpenAI imagegen",
  creationMethod: "AI生成画像から色・近似法線・粗さを作成",
  sourceHash: hash(source),
  references: [
    "https://www.daiken.jp/buildingmaterials/publiccase/0031/img/0031_print.pdf",
    "https://www.daiken.jp/business-p/DispOutLineDetail.do?itemID=t000100002983&volumeName=00001",
  ],
  appliedSizeMeters: [0.606, 0.606],
  panelSizeMeters: [0.606, 0.303],
  processing:
    "512pxの色、256pxの近似法線、128pxの粗さを共有。目地も画像に含め、天井板や穴のポリゴンは追加しない。",
  generationPrompt:
    "Seamless orthographic albedo of clean warm-white Japanese school mineral-fiber acoustic ceiling board, 606 mm square, irregular travertine pinholes and short branching fissures, subtle gray-beige cavities, flat white field dominates, evenly lit, no borders, no grid, no fixtures, no text, no directional lighting.",
  maps,
};
attribution.assets = attribution.assets.filter((asset) => asset.id !== entry.id);
attribution.assets.push(entry);
await writeFile(attributionFile, `${JSON.stringify(attribution, null, 2)}\n`);
await import("./catalog.mjs");
