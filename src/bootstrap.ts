import { createLoading } from "./interface/loading";
import { loadTokyoWeather } from "./weather/client";
import { createRoomAssetLoader } from "./assets/loading";
import type { RoomAssetLoader } from "./assets/loading";
import { createWeatherAudio } from "./scene/audio";
import { loadProfileAvatar } from "./content/avatar";
import { prepareBoardFont, prepareBoardHeadingFont } from "./assets/typography";
import { createPaperPrinter } from "./scene/board/printing";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("表示先が見つかりません。");
const loading = createLoading(root);
const audio = createWeatherAudio();
window.addEventListener("error", (event) =>
  loading.fail(event.error ? event.error : event.message),
);
window.addEventListener("unhandledrejection", (event) => loading.fail(event.reason));

let assets: RoomAssetLoader | undefined;
const printer = createPaperPrinter();
try {
  const weatherReady = loadTokyoWeather();
  const avatarReady = loadProfileAvatar();
  assets = createRoomAssetLoader((summary) => loading.progress(summary.progressPercent, 100));
  const fontsReady = Promise.all([
    import("./assets/fonts/board-text.css").then(() => prepareBoardFont("")),
    import("./assets/fonts/yomogi.css").then(() => prepareBoardHeadingFont()),
  ]).then(() => undefined);
  await loading.ready;
  const room = await import("./main");
  await room.startRoom(
    root,
    loading,
    weatherReady,
    assets,
    audio,
    avatarReady,
    printer,
    fontsReady,
  );
} catch (error) {
  printer.dispose(error);
  assets?.abort(error);
  loading.fail(error);
}
