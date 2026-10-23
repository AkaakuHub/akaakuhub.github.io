import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: { watch: { ignored: ["**/worktree/**"] } },
  build: { target: "es2023" },
});
