import type { WeatherAudio } from "../scene/audio";
import { Volume2, VolumeX, createElement } from "lucide";
import { createDeviceControl } from "./device-control";
import type { createControlIntroduction } from "./control-introduction";

export function bindSoundControl(
  root: HTMLElement,
  audio: WeatherAudio,
  introduction: ReturnType<typeof createControlIntroduction>,
): void {
  const button = createDeviceControl(root, "sound", "天気の音");
  button.setAttribute("aria-keyshortcuts", "M");
  audio.bindMute((muted) => {
    introduction.setSoundEnabled(!muted);
    button.setAttribute("aria-pressed", String(!muted));
    button.title = muted ? "天気の音を再生(M)" : "天気の音を消す(M)";
    button.replaceChildren(
      createElement(muted ? VolumeX : Volume2, { width: 22, height: 22, "aria-hidden": "true" }),
    );
  });
  button.addEventListener("click", audio.toggleMuted);
  audio.bindAvailable((available) => {
    button.hidden = !available;
    introduction.setSoundAvailable(available);
  });
}
