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
  const colorSize = painted ? 1024 : 512;
  let color = sharp(input("Color")).resize(colorSize, colorSize);
  if (painted) color = color.grayscale().linear(0.16, 212).toColourspace("srgb");
  await save("color", await color.webp({ quality: 85 }).toBuffer(), ["Color"], colorSize);
  if (painted) {
    await save(
      "normal",
      await sharp(input("NormalGL"))
        .resize(512, 512)
        .webp({ quality: 90, smartSubsample: true })
        .toBuffer(),
      ["NormalGL"],
      512,
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
    packed[pixel * 3 + 1] = painted
      ? Math.round(120 + channels[0][pixel] * 0.5)
      : channels[0][pixel];
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
  if (asset) {
    Object.assign(asset.maps, maps);
    if (painted)
      asset.processing =
        "黄色の塗装色を無彩色化し、明度差を16%に抑えて部材の塗装色を乗算。粗さを半光沢の塗装に調整。R=255、G=粗さ、B=金属度で格納。";
  } else {
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
const plaster = attribution.assets.find((asset) => asset.id === "painted_plaster_wall");
for (const name of ["color", "normal"]) {
  const map = plaster.maps[name];
  const response = await fetch(map.url);
  if (!response.ok) throw new Error(`${map.url}: ${response.status}`);
  const size = name === "color" ? 1024 : 512;
  let image = sharp(new Uint8Array(await response.arrayBuffer())).resize(size, size);
  if (name === "color") image = image.linear(0.24, 194);
  const bytes = await image.webp({ quality: 90, smartSubsample: true }).toBuffer();
  await writeFile(map.file, bytes);
  map.dimensions = [size, size];
  map.sha256 = hash(bytes);
  if (name === "normal") map.encoding = "WebP quality 90, smart chroma subsampling";
}
plaster.appliedSizeMeters = [3.2, 3.2];
plaster.processing = "写真の色の変化を24%に抑え、汚れのコントラストを弱める。";
await writeFile(attributionFile, JSON.stringify(attribution, null, 2) + "\n");
await import("./catalog.mjs");
