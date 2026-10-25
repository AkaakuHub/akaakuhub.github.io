import { createLoading } from "./interface/loading";
import { prepareRecovery } from "./interface/recovery";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const loading = createLoading(root);
window.addEventListener("error", (event) =>
  loading.fail(event.error ? event.error : event.message),
);
window.addEventListener("unhandledrejection", (event) => loading.fail(event.reason));

try {
  await prepareRecovery();
  const [room] = await Promise.all([
    import("./main"),
    import("./assets/fonts/zen-maru-gothic.css"),
    import("./assets/fonts/board-text.css"),
    import("./assets/fonts/yomogi.css"),
  ]);
  await room.startRoom(root, loading);
} catch (error) {
  loading.fail(error);
}
