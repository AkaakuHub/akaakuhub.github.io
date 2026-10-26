import type { WeatherAudio } from "../scene/audio";
import { Volume2, VolumeX, createElement } from "lucide";
import "./sound.css";
import type { createControlIntroduction } from "./control-introduction";

export function bindSoundControl(
  root: HTMLElement,
  audio: WeatherAudio,
  introduction: ReturnType<typeof createControlIntroduction>,
): void {
  const navigation = root.querySelector(".room-keyboard");
  if (!navigation) throw new Error("音の操作対象を配置できませんでした。");
  const button = document.createElement("button");
  button.className = "room-sound room-device-control";
  button.type = "button";
  button.setAttribute("aria-keyshortcuts", "M");
  button.setAttribute("aria-label", "天気の音");
  audio.bindMute((muted) => {
    introduction.setSoundEnabled(!muted);
    button.setAttribute("aria-pressed", String(!muted));
    button.title = muted ? "天気の音を再生(M)" : "天気の音を消す(M)";
    button.replaceChildren(
      createElement(muted ? VolumeX : Volume2, { width: 22, height: 22, "aria-hidden": "true" }),
    );
  });
  button.addEventListener("click", audio.toggleMuted);
  navigation.append(button);
}
