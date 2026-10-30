import type { createRendering } from "../scene/rendering";
import { createDeviceControl } from "./device-control";
import "./hdr.css";

export function bindHdrControl(
  root: HTMLElement,
  rendering: Pick<Awaited<ReturnType<typeof createRendering>>, "observeHdr" | "toggleHdr">,
  requestFrame: () => void,
  announce: (message: string) => void,
): void {
  const button = createDeviceControl(root, "hdr", "HDR");
  button.textContent = "HDR";
  rendering.observeHdr((enabled, supported) => {
    button.hidden = !supported;
    button.setAttribute("aria-pressed", String(enabled));
    button.title = enabled ? "HDRをオフにする" : "HDRをオンにする";
    button.setAttribute("aria-label", button.title);
  });
  button.addEventListener("click", () => {
    const enabled = rendering.toggleHdr();
    requestFrame();
    announce(enabled ? "HDRをオンにしました" : "HDRをオフにしました");
  });
}
