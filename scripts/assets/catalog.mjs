import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = "src/assets";
const entries = [];
for (const name of await readdir(root, { recursive: true })) {
  if (!name.endsWith(".webp") && !name.endsWith(".bin") && !name.endsWith(".opus")) continue;
  const path = join(root, name);
  const bytes = await readFile(path);
  entries.push({
    id: relative(root, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
entries.sort((left, right) => left.id.localeCompare(right.id));
await writeFile(join(root, "manifest.json"), `${JSON.stringify(entries, null, 2)}\n`);
