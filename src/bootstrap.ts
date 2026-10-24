import { createLoading } from "./interface/loading";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const loading = createLoading(root);
try {
  await import("./main");
} catch (error) {
  loading.fail(error instanceof Error ? error.message : "部室を読み込めませんでした。");
  throw error;
}
