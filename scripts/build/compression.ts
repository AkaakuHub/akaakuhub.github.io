import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import type { Plugin } from "vite-plus";
import { acceptsBrotli } from "./encoding";

const compress = promisify(brotliCompress);

export function compressedAssets(): Plugin {
  return {
    name: "compressed-assets",
    async writeBundle(options, bundle) {
      if (!options.dir) throw new Error("圧縮する配信ファイルの出力先がありません。");
      const directory = options.dir;
      const files = Object.values(bundle).filter((file) => /\.(js|css)$/.test(file.fileName));
      await Promise.all(
        files.map(async (file) => {
          const path = resolve(directory, file.fileName);
          const source = await compress(await readFile(path), {
            params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
          });
          await writeFile(`${path}.br`, source);
        }),
      );
    },
    configurePreviewServer(server) {
      const directory = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((request, response, next) => {
        if (
          !request.url ||
          (request.method !== "GET" && request.method !== "HEAD") ||
          !acceptsBrotli(request.headers["accept-encoding"])
        ) {
          next();
          return;
        }
        const path = new URL(request.url, "http://localhost").pathname;
        if (!/^\/assets\/[\w.-]+\.(js|css)$/.test(path)) {
          next();
          return;
        }
        void readFile(resolve(directory, `.${path}.br`)).then((bytes) => {
          for (const [name, value] of Object.entries(server.config.preview.headers ?? {}))
            if (value !== undefined) response.setHeader(name, value);
          response.setHeader("Content-Encoding", "br");
          response.setHeader("Content-Length", bytes.byteLength);
          response.setHeader(
            "Content-Type",
            path.endsWith(".css") ? "text/css" : "text/javascript",
          );
          response.appendHeader("Vary", "Accept-Encoding");
          response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          response.end(request.method === "HEAD" ? undefined : bytes);
        }, next);
      });
    },
  };
}
