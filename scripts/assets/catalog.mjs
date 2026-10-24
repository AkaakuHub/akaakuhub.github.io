import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = "src/assets";
const entries = [];
for (const directory of ["materials", "lighting"]) {
  for (const name of await readdir(join(root, directory), { recursive: true })) {
    if (!/\.(webp|data)$/.test(name)) continue;
    const path = join(root, directory, name);
    const bytes = await readFile(path);
    entries.push({
      id: relative(root, path),
      bytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
}
entries.sort((left, right) => left.id.localeCompare(right.id));
await writeFile(join(root, "manifest.json"), `${JSON.stringify(entries, null, 2)}\n`);
