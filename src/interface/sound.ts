import type { WeatherAudio } from "../scene/audio";

export function bindSoundControl(root: HTMLElement, audio: WeatherAudio): void {
  const navigation = root.querySelector(".room-keyboard");
  if (!navigation) throw new Error("音の操作対象を配置できませんでした。");
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-keyshortcuts", "M");
  audio.bindMute((muted) => {
    button.setAttribute("aria-pressed", String(muted));
    button.textContent = muted ? "天気の音を再生" : "天気の音を消す";
  });
  button.addEventListener("click", audio.toggleMuted);
  navigation.append(button);
}
