import "./corners.css";
import type { createView, ViewState } from "../scene/view";

export function createCornerControls(root: HTMLElement, view: ReturnType<typeof createView>) {
  const navigation = root.querySelector(".room-keyboard");
  if (!navigation) throw new Error("視点操作の配置先が見つかりません。");
  const actions = [
    { corner: "left", label: "左を向く", run: () => view.turn(1) },
    { corner: "right", label: "右を向く", run: () => view.turn(-1) },
    { corner: "up", label: "天井を向く", run: () => view.vertical(1) },
    { corner: "down", label: "天井から壁へ戻る", run: () => view.vertical(-1) },
  ] as const;
  const buttons = actions.map((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.viewCorner = action.corner;
    button.className = "room-corner";
    button.textContent = ">";
    button.setAttribute("aria-label", action.label);
    button.addEventListener("click", action.run);
    navigation.append(button);
    return { button, corner: action.corner };
  });
  return (state: ViewState): void => {
    for (const { button, corner } of buttons) {
      button.hidden = state.mode !== "room";
      button.disabled = corner === "down" && (state.mode !== "room" || state.direction !== 4);
    }
  };
}
