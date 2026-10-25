import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const id = "oak_veneer_01";
async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
const [info, files] = await Promise.all(
  ["info", "files"].map(async (kind) =>
    JSON.parse(new TextDecoder().decode(await download(`https://api.polyhaven.com/${kind}/${id}`))),
  ),
);
const directory = `src/assets/materials/${id}`;
await mkdir(directory, { recursive: true });
const maps = {};
await Promise.all(
  [
    ["color", "Diffuse", 1024],
    ["normal", "nor_gl", 512],
    ["arm", "arm", 256],
  ].map(async ([name, source, size]) => {
    const original = files[source]["1k"].jpg;
    const input = await download(original.url);
    let image = sharp(input).resize(size, size);
    if (name === "arm") {
      const { data, info: raw } = await image
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let pixel = 0; pixel < data.length; pixel += raw.channels) {
        data[pixel + 1] = Math.round(179 + data[pixel + 1] * 0.24);
        data[pixel + 2] = 0;
      }
      image = sharp(data, { raw });
    }
    const bytes = await image
      .webp(name === "arm" ? { lossless: true } : { quality: 90, smartSubsample: true })
      .toBuffer();
    const file = `${directory}/${name}.webp`;
    await writeFile(file, bytes);
    maps[name] = {
      file,
      url: original.url,
      sourceHash: original.md5,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      dimensions: [size, size],
    };
    console.log(`${file}: ${bytes.length} bytes`);
  }),
);
const file = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(file, "utf8"));
attribution.assets = attribution.assets.filter((asset) => asset.id !== id);
attribution.assets.push({
  id,
  name: info.name,
  provider: "Poly Haven",
  authors: info.authors,
  source: `https://polyhaven.com/a/${id}`,
  license: "CC0-1.0",
  licenseUrl: "https://polyhaven.com/license",
  sizeMeters: info.dimensions.map((value) => value / 1000),
  processing: "色と木目の形状は元画像を保持。粗さは0.70〜0.94へ変換し、つや消し仕上げとして使用。",
  maps,
});
await writeFile(file, JSON.stringify(attribution, null, 2) + "\n");
