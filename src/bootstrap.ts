import { createLoading } from "./interface/loading";
import { prepareRecovery } from "./interface/recovery";
import { loadSiteContent } from "./content/client";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const loading = createLoading(root);
window.addEventListener("error", (event) =>
  loading.fail(event.error ? event.error : event.message),
);
window.addEventListener("unhandledrejection", (event) => loading.fail(event.reason));

try {
  await prepareRecovery();
  const contentReady = loadSiteContent();
  const [room, content] = await Promise.all([import("./main"), contentReady]);
  await room.startRoom(root, content, loading);
} catch (error) {
  console.error(error);
  loading.fail(error);
}
