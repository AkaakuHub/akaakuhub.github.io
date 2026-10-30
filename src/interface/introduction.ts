import "./introduction.css";
import { ArrowUpRight, createElement } from "lucide";
import type { createView } from "../scene/view";

export function createIntroduction(root: HTMLElement, view: ReturnType<typeof createView>) {
  const guide = document.createElement("button");
  guide.type = "button";
  guide.className = "room-introduction";
  guide.tabIndex = -1;
  guide.hidden = true;
  const arrow = createElement(ArrowUpRight, {
    width: 40,
    height: 40,
    "stroke-width": 1.6,
    class: "room-introduction__arrow",
    "aria-hidden": "true",
  });
  const message = document.createElement("span");
  message.textContent = window.matchMedia("(pointer: coarse)").matches
    ? "紙の外をタップしてみてください"
    : "紙の外をクリックしてみてください";
  guide.append(arrow, message);
  guide.addEventListener("click", () => view.back());
  root.append(guide);
  return {
    start(): void {
      view.startIntroduction();
      guide.hidden = !view.showExitGuide;
    },
    update(): void {
      guide.hidden = !view.showExitGuide;
    },
  };
}
