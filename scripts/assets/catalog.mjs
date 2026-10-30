import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { materialAssetIds, materialDefinitions } from "../../src/assets/materials.ts";
import { areaLightAssetId } from "../../src/assets/lighting.ts";
import { cloudFieldId, cloudTextureId, horizonTextureId } from "../../src/assets/environment.ts";
import { createAssetPack } from "../../src/assets/packing.ts";

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
const initial = new Set([
  ...materialAssetIds.filter((id) => id.startsWith(`materials/${materialDefinitions.paper.id}/`)),
  areaLightAssetId,
]);
const members = [];
await mkdir(join(root, "room"), { recursive: true });
for (const [name, ids] of [
  ["initial", roomIds.filter((id) => initial.has(id))],
  ["surfaces", roomIds.filter((id) => !initial.has(id))],
]) {
  const sources = await Promise.all(
    ids.map(async (id) => ({ id, bytes: await readFile(join(root, id)) })),
  );
  const pack = createAssetPack(sources);
  const id = `room/${name}.bin`;
  await writeChanged(join(root, id), pack.bytes);
  register(id, pack.bytes);
  members.push(...pack.entries.map((entry) => ({ ...entry, pack: id })));
}
await writeChanged(join(root, "room-manifest.json"), `${JSON.stringify(members, null, 2)}\n`);
for (const name of await readdir(join(root, "audio"))) {
  if (!name.endsWith(".opus")) continue;
  const id = `audio/${name}`;
  register(id, await readFile(join(root, id)));
}
entries.sort((left, right) => left.id.localeCompare(right.id));
await writeChanged(join(root, "manifest.json"), `${JSON.stringify(entries, null, 2)}\n`);
