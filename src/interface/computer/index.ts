import "./screen.css";
import { Power, createElement } from "lucide";
import { Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import type { assembleClubroom } from "../../scene/clubroom";
import type { createView } from "../../scene/view";
import type { BoardState } from "../../scene/board/notices";
import { createComputerScreen } from "../../scene/furniture/computer/screen";
import { renderRepositories } from "./repositories";

export function createComputerInterface(
  root: HTMLElement,
  computer: ReturnType<typeof assembleClubroom>["computer"],
  view: ReturnType<typeof createView>,
  invalidate: () => void,
) {
  const button = root.querySelector<HTMLButtonElement>(".computer-power");
  const panel = root.querySelector<HTMLElement>(".computer-screen");
  const list = root.querySelector<HTMLElement>(".repository-list");
  const close = root.querySelector<HTMLButtonElement>(".computer-screen-close");
  if (!button || !panel || !list || !close) throw new Error("PCの操作画面が見つかりません。");
  button.append(createElement(Power, { "aria-hidden": "true" }));
  const draw = createComputerScreen(computer.monitor.material);
  const point = new Vector3();
  let powered = false;
  let state: BoardState = { status: "loading" };
  let wasOpen = false;
  let listDirty = true;
  draw(powered, state);
  const togglePower = () => {
    powered = !powered;
    computer.power.material.emissiveIntensity = powered ? 1 : 0;
    button.setAttribute("aria-pressed", String(powered));
    button.setAttribute("aria-label", powered ? "PCの電源を切る" : "PCの電源を入れる");
    button.title = powered ? "PCの電源を切る" : "PCの電源を入れる";
    draw(powered, state);
    if (!powered && view.state.mode === "monitor") view.inspectComputer();
    invalidate();
  };
  button.onclick = togglePower;
  close.onclick = () => view.inspectComputer();
  return {
    targets: {
      object: computer.object,
      monitor: computer.monitor,
      power: computer.power,
      isPowered: () => powered,
    },
    togglePower,
    setState(next: BoardState) {
      state = next;
      if (powered) draw(powered, state);
      listDirty = true;
    },
    update(camera: PerspectiveCamera, moving: boolean) {
      const open = powered && view.state.mode === "monitor" && !moving;
      if (open && listDirty) {
        renderRepositories(list, state);
        listDirty = false;
      }
      panel.hidden = !open;
      if (open && !wasOpen) close.focus({ preventScroll: true });
      wasOpen = open;
      computer.power.getWorldPosition(point).project(camera);
      button.hidden =
        moving ||
        view.state.mode === "monitor" ||
        (view.state.mode !== "computer" &&
          (view.state.mode !== "room" || view.state.direction !== 1)) ||
        point.z < -1 ||
        point.z > 1 ||
        Math.abs(point.x) > 1 ||
        Math.abs(point.y) > 1;
      button.style.left = `${((point.x + 1) / 2) * root.clientWidth}px`;
      button.style.top = `${((1 - point.y) / 2) * root.clientHeight}px`;
    },
  };
}
