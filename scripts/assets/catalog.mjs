import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { materialAssetIds, materialDefinitions } from "../../src/assets/materials.ts";
import { areaLightAssetId } from "../../src/assets/lighting.ts";
import { cloudFieldId, cloudTextureId, horizonTextureId } from "../../src/assets/environment.ts";
import { createAssetPack } from "../../src/assets/packing.ts";
import sharp from "sharp";

const root = "src/assets";
const entries = [];
async function writeChanged(path, source) {
  const bytes = Buffer.from(source);
  if (existsSync(path) && bytes.equals(await readFile(path))) return;
  await writeFile(path, bytes);
}
function register(id, bytes) {
  entries.push({
    id,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
const roomIds = [
  ...materialAssetIds,
  areaLightAssetId,
  cloudTextureId,
  cloudFieldId,
  horizonTextureId,
];
await mkdir(join(root, "room"), { recursive: true });
const sources = await Promise.all(
  roomIds.map(async (id) => {
    const source = await readFile(join(root, id));
    if (
      !materialAssetIds.includes(id) ||
      id.startsWith(`materials/${materialDefinitions.paper.id}/`)
    )
      return { id, bytes: source };
    const bytes = await sharp(source)
      .resize({ width: id.endsWith("color.webp") ? 512 : 256, withoutEnlargement: true })
      .webp({
        lossless: !id.endsWith("color.webp") && !id.endsWith("normal.webp"),
        quality: id.endsWith("color.webp") ? 85 : 90,
        smartSubsample: true,
      })
      .toBuffer();
    return { id, bytes };
  }),
);
const pack = createAssetPack(sources);
const packId = "room/initial.bin";
await writeChanged(join(root, packId), pack.bytes);
register(packId, pack.bytes);
const members = pack.entries.map((entry) => ({ ...entry, pack: packId }));
await writeChanged(join(root, "room-manifest.json"), `${JSON.stringify(members, null, 2)}\n`);
for (const name of await readdir(join(root, "audio"))) {
  if (!name.endsWith(".opus")) continue;
  const id = `audio/${name}`;
  register(id, await readFile(join(root, id)));
}
entries.sort((left, right) => left.id.localeCompare(right.id));
await writeChanged(join(root, "manifest.json"), `${JSON.stringify(entries, null, 2)}\n`);
