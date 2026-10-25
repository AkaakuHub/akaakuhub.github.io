import "./introduction.css";
import type { ViewState } from "../scene/view";

export function createIntroduction(root: HTMLElement, leavePaper: () => void) {
  const guide = document.createElement("button");
  guide.type = "button";
  guide.className = "room-introduction";
  guide.tabIndex = -1;
  guide.hidden = true;
  const arrow = document.createElement("span");
  arrow.className = "room-introduction__arrow";
  arrow.textContent = "↗";
  arrow.setAttribute("aria-hidden", "true");
  const message = document.createElement("span");
  message.textContent = window.matchMedia("(pointer: coarse)").matches
    ? "紙の外をタップしてみてください"
    : "紙の外をクリックしてみてください";
  guide.append(arrow, message);
  guide.addEventListener("click", leavePaper);
  root.append(guide);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let discovered = false;
  return {
    start(): void {
      if (discovered) return;
      timer = setTimeout(() => {
        if (!discovered) guide.hidden = false;
      }, 5000);
    },
    update(state: ViewState): void {
      if (state.mode !== "room") return;
      discovered = true;
      clearTimeout(timer);
      guide.remove();
    },
  };
}
