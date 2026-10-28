import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { materialDefinitions } from "../../src/assets/materials.ts";

const file = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(file, "utf8"));
let before = 0;
let after = 0;
for (const [name, definition] of Object.entries(materialDefinitions)) {
  if (definition.format !== "arm" || name === "aluminum" || name === "paint") continue;
  const entry = attribution.assets.find((asset) => asset.id === definition.id).maps.arm;
  const source = await readFile(entry.file);
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let index = 2; index < data.length; index += info.channels) data[index] = 0;
  const encoded = await sharp(data, { raw: info }).webp({ lossless: true }).toBuffer();
  const decoded = await sharp(encoded).removeAlpha().raw().toBuffer();
  for (let index = 0; index < data.length; index++)
    if (index % info.channels !== 2 && data[index] !== decoded[index])
      throw new Error(`Surface channel changed: ${entry.file}`);
  await writeFile(entry.file, encoded);
  entry.sha256 = createHash("sha256").update(encoded).digest("hex");
  entry.processing = "未使用の青チャンネルを除去。AOと粗さの値は変更しない。";
  before += source.length;
  after += encoded.length;
}
await writeFile(file, JSON.stringify(attribution, null, 2) + "\n");
console.log(`Packed surfaces: ${before} -> ${after} bytes, active channels unchanged`);
await import("./catalog.mjs");
