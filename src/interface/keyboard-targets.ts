import { MathUtils } from "three";
import type { createInterface } from ".";
import type { Notice } from "../scene/board";
import type { createView } from "../scene/view";
import type { createComputerInterface } from "./computer";
import type { bindRoomSwitch } from "./room-switch";

export function bindKeyboardTargets(
  root: HTMLElement,
  ui: ReturnType<typeof createInterface>,
  view: ReturnType<typeof createView>,
  notices: readonly Notice[],
  computer: ReturnType<typeof createComputerInterface>,
  lightSwitch: ReturnType<typeof bindRoomSwitch>,
  refreshBoard: () => void,
) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-notice-index]")];
  const light = root.querySelector<HTMLButtonElement>("[data-room-light]");
  const power = root.querySelector<HTMLButtonElement>("[data-computer-power]");
  const monitor = root.querySelector<HTMLButtonElement>("[data-computer-monitor]");
  const navigation = root.querySelector<HTMLElement>(".room-keyboard");
  if (buttons.length !== 4 || notices.length !== 4 || !light || !power || !monitor || !navigation)
    throw new Error("キーボード操作の対象が揃っていません。");
  const lightButton: HTMLButtonElement = light;
  const powerButton: HTMLButtonElement = power;
  const monitorButton: HTMLButtonElement = monitor;
  const canvas = ui.canvas;
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !event.shiftKey) return;
    const last = [...navigation.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].at(
      -1,
    );
    if (!last) return;
    event.preventDefault();
    last.focus({ preventScroll: true });
  });
  navigation.addEventListener("keydown", (event) => {
    const last = [...navigation.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].at(
      -1,
    );
    if (event.key !== "Tab" || event.shiftKey || event.target !== last) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
  });

  buttons.forEach((button, index) => {
    button.addEventListener("focus", () => view.inspect(index));
    button.addEventListener("click", () => {
      const notice = notices[index];
      if (!notice) throw new Error("掲示の操作対象が見つかりません。");
      if (notice.link) window.open(notice.link.href, "_blank", "noopener,noreferrer");
      else refreshBoard();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const column = MathUtils.clamp(
        Math.floor(index / 2) +
          (event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0),
        0,
        1,
      );
      const row = MathUtils.clamp(
        (index % 2) + (event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0),
        0,
        1,
      );
      const next = buttons[column * 2 + row];
      if (!next) throw new Error("隣の掲示が見つかりません。");
      next.focus({ preventScroll: true });
    });
  });

  lightButton.addEventListener("focus", () => view.select(3));
  function toggleLight(): void {
    const on = lightSwitch.toggle();
    lightButton.setAttribute("aria-pressed", String(on));
    ui.announce(on ? "部屋の電気を点けました" : "部屋の電気を消しました");
  }
  lightButton.addEventListener("click", toggleLight);
  powerButton.addEventListener("focus", () => view.inspectComputer());
  function togglePower(): void {
    const on = computer.togglePower();
    powerButton.setAttribute("aria-pressed", String(on));
    monitorButton.disabled = !on;
    ui.announce(on ? "PCの電源を入れました" : "PCの電源を切りました");
  }
  powerButton.addEventListener("click", togglePower);
  monitorButton.addEventListener("focus", () => {
    view.inspectMonitor();
    const selected = computer.select(0);
    if (selected) ui.announce(selected);
  });
  monitorButton.addEventListener("click", () => computer.activateSelection());
  monitorButton.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.key === "PageUp" || event.key === "PageDown" ? 3 : 1;
    const selected = computer.select(
      event.key === "ArrowUp" || event.key === "PageUp" ? -step : step,
    );
    if (selected) ui.announce(selected);
  });
  navigation.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key))
      event.stopPropagation();
  });

  function syncNotices(): void {
    buttons.forEach((button, index) => {
      const notice = notices[index];
      if (!notice) throw new Error("掲示の操作対象が見つかりません。");
      button.textContent = notice.link
        ? `${notice.title}：${notice.link.label}`
        : `${notice.title}：掲示を再取得`;
    });
  }
  syncNotices();
  return { syncNotices, toggleLight, togglePower };
}
