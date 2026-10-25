import { readFileSync } from "node:fs";
import type { ServerOptions } from "node:https";
import { defineConfig, loadEnv } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  const headers = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  };
  let https: ServerOptions | undefined;
  if (command === "serve") {
    const environment = loadEnv(mode, process.cwd(), "DEV_TLS_");
    const cert = environment.DEV_TLS_CERT_FILE;
    const key = environment.DEV_TLS_KEY_FILE;
    if (!cert || !key) throw new Error("HTTPSの証明書と秘密鍵を設定してください。");
    https = { cert: readFileSync(cert), key: readFileSync(key) };
  }
  return {
    plugins: [
      tailwindcss(),
      {
        name: "loading-document",
        transformIndexHtml: {
          order: "pre",
          handler(html) {
            return html.replace(
              "<!-- loading-styles -->",
              `<style>${readFileSync(new URL("./src/interface/loading.css", import.meta.url), "utf8")}</style>`,
            );
          },
        },
      },
    ],
    optimizeDeps: { exclude: ["unified-asset-loader"] },
    server: {
      host: "0.0.0.0",
      port: 5174,
      strictPort: true,
      https,
      headers,
      proxy: { "/api/": "http://127.0.0.1:8787" },
      watch: { ignored: ["**/worktree/**"] },
    },
    preview: { https, headers },
    build: { target: "es2023", assetsInlineLimit: 0 },
  };
});
