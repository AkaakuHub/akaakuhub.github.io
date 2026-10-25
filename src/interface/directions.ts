import "./directions.css";
import { ChevronRight, createElement } from "lucide";
import type { createView, ViewState } from "../scene/view";

export function createDirectionControls(root: HTMLElement, view: ReturnType<typeof createView>) {
  const navigation = root.querySelector(".room-keyboard");
  if (!navigation) throw new Error("視点操作の配置先が見つかりません。");
  const actions = [
    { direction: "left", label: "左を向く", run: () => view.turn(1) },
    { direction: "right", label: "右を向く", run: () => view.turn(-1) },
    { direction: "up", label: "天井を向く", run: () => view.vertical(1) },
    { direction: "down", label: "天井から壁へ戻る", run: () => view.vertical(-1) },
  ] as const;
  const buttons = actions.map((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.viewDirection = action.direction;
    button.className = "room-direction";
    button.append(
      createElement(ChevronRight, {
        width: 30,
        height: 30,
        "stroke-width": 1.6,
        "aria-hidden": "true",
      }),
    );
    button.setAttribute("aria-label", action.label);
    button.addEventListener("click", action.run);
    navigation.append(button);
    return { button, direction: action.direction };
  });
  return (state: ViewState): void => {
    for (const { button, direction } of buttons) {
      button.hidden =
        state.mode !== "room" ||
        (state.direction === 4 ? direction !== "down" : direction === "down");
    }
  };
}
