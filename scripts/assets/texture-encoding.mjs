import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const attributionFile = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(attributionFile, "utf8"));
let before = 0;
let after = 0;
for (const asset of attribution.assets) {
  for (const [name, quality] of [
    ["normal", 90],
    ["color", 85],
  ]) {
    const map = asset.maps[name];
    if (!map) continue;
    const encoding = `WebP quality ${quality}, smart chroma subsampling`;
    const source = await readFile(map.file);
    before += source.length;
    if (map.encoding !== encoding) {
      const encoded = await sharp(source).webp({ quality, smartSubsample: true }).toBuffer();
      if (encoded.length < source.length) {
        await writeFile(map.file, encoded);
        map.sha256 = createHash("sha256").update(encoded).digest("hex");
        map.encoding = encoding;
        after += encoded.length;
        continue;
      }
    }
    after += source.length;
  }
}
await writeFile(attributionFile, JSON.stringify(attribution, null, 2) + "\n");
console.log(`Texture images: ${before} -> ${after} bytes, dimensions unchanged`);
await import("./catalog.mjs");
