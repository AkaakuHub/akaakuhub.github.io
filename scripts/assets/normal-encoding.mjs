import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const attributionFile = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(attributionFile, "utf8"));
const encoding = "WebP quality 90, smart chroma subsampling";
let before = 0;
let after = 0;
for (const asset of attribution.assets) {
  const normal = asset.maps.normal;
  if (!normal) continue;
  const source = await readFile(normal.file);
  before += source.length;
  if (normal.encoding !== encoding) {
    const encoded = await sharp(source).webp({ quality: 90, smartSubsample: true }).toBuffer();
    if (encoded.length < source.length) {
      await writeFile(normal.file, encoded);
      normal.sha256 = createHash("sha256").update(encoded).digest("hex");
      normal.encoding = encoding;
      after += encoded.length;
      continue;
    }
  }
  after += source.length;
}
await writeFile(attributionFile, JSON.stringify(attribution, null, 2) + "\n");
console.log(`Normal maps: ${before} -> ${after} bytes, dimensions unchanged`);
await import("./catalog.mjs");
