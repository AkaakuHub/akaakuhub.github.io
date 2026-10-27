import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite-plus";

const run = promisify(execFile);

export function prepareRoomAssets(): Plugin {
  let root: string;
  return {
    name: "prepare-room-assets",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async buildStart() {
      await run(process.execPath, [resolve(root, "scripts/assets/catalog.mjs")], { cwd: root });
    },
  };
}
