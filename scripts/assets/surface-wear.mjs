import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { unzipSync } from "three/addons/libs/fflate.module.js";

const attributionFile = "public/materials/attribution.json";
const attribution = JSON.parse(await readFile(attributionFile, "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

for (const id of ["Metal050B", "PaintedMetal001"]) {
  const url = `https://ambientcg.com/get?file=${id}_1K-JPG.zip`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const input = (name) => {
    const member = `${id}_1K-JPG_${name}.jpg`;
    const bytes = archive[member];
    if (!bytes) throw new Error(`Missing ${member}`);
    return bytes;
  };
  const directory = `src/assets/materials/${id}`;
  await mkdir(directory, { recursive: true });
  const maps = {};
  async function save(name, bytes, members, dimensions) {
    const file = `${directory}/${name}.webp`;
    await writeFile(file, bytes);
    maps[name] = {
      file,
      url,
      archiveMembers: members.map((name) => `${id}_1K-JPG_${name}.jpg`),
      sourceHashes: Object.fromEntries(members.map((name) => [name, hash(input(name))])),
      sha256: hash(bytes),
      dimensions: [dimensions, dimensions],
    };
  }
  const painted = id === "PaintedMetal001";
  let color = sharp(input("Color")).resize(512, 512);
  if (painted) color = color.grayscale().linear(0.35, 165).toColourspace("srgb");
  await save("color", await color.webp({ quality: 78 }).toBuffer(), ["Color"], 512);
  if (painted) {
    await save(
      "normal",
      await sharp(input("NormalGL"))
        .resize(256, 256)
        .webp({ quality: 90, smartSubsample: true })
        .toBuffer(),
      ["NormalGL"],
      256,
    );
    maps.normal.encoding = "WebP quality 90, smart chroma subsampling";
  }
  const channels = await Promise.all(
    ["Roughness", "Metalness"].map((name) =>
      sharp(input(name)).resize(256, 256).removeAlpha().extractChannel(0).raw().toBuffer(),
    ),
  );
  const packed = Buffer.alloc(256 * 256 * 3);
  for (let pixel = 0; pixel < 256 * 256; pixel++) {
    packed[pixel * 3] = 255;
    packed[pixel * 3 + 1] = channels[0][pixel];
    packed[pixel * 3 + 2] = channels[1][pixel];
  }
  await save(
    "arm",
    await sharp(packed, { raw: { width: 256, height: 256, channels: 3 } })
      .webp({ lossless: true })
      .toBuffer(),
    ["Roughness", "Metalness"],
    256,
  );
  const asset = attribution.assets.find((asset) => asset.id === id);
  if (asset) Object.assign(asset.maps, maps);
  else {
    attribution.assets.push({
      id,
      name: id,
      provider: "ambientCG",
      authors: { "Lennart Demes": "Material creation" },
      source: `https://ambientcg.com/view?id=${id}`,
      license: "CC0-1.0",
      licenseUrl: "https://docs.ambientcg.com/license/",
      creationMethod: "PBRProcedural",
      appliedSizeMeters: [0.8, 0.8],
      scaleNote: "配布元に実寸指定がないため、塗装金具の擦り傷を表す大きさとして設定。",
      processing:
        "黄色の塗装色を無彩色化して明度差を圧縮し、金具ごとの塗装色を乗算。R=255、G=粗さ、B=金属度で格納。",
      maps,
    });
  }
  console.log(`${id}: ${Object.keys(maps).join(", ")}`);
}
await writeFile(attributionFile, JSON.stringify(attribution, null, 2) + "\n");
await import("./catalog.mjs");
