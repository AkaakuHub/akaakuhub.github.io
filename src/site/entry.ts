import { showRoomVersion, showTextVersion } from "./display";

function supportsRoom(): boolean {
  if (navigator.gpu) return true;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2");
  if (!context) return false;
  context.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

const crawler =
  /bot|crawler|spider|slurp|Google-InspectionTool|facebookexternalhit|Twitterbot|bingpreview/i.test(
    navigator.userAgent,
  );
if (new URLSearchParams(location.search).get("view") !== "2d" && !crawler && supportsRoom()) {
  showRoomVersion();
  void import("../bootstrap").catch(() => showTextVersion());
}
