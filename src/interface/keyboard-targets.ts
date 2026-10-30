import { profile } from "../content/profile";
import { privacy, privacyText } from "../content/privacy";
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
  const screen = root.querySelector<HTMLButtonElement>("[data-computer-screen]");
  const power = root.querySelector<HTMLButtonElement>("[data-computer-power]");
  const navigation = root.querySelector<HTMLElement>(".room-keyboard");
  if (buttons.length !== 4 || notices.length !== 4 || !light || !power || !screen || !navigation)
    throw new Error("キーボード操作の対象が揃っていません。");
  const lightButton: HTMLButtonElement = light;
  const powerButton: HTMLButtonElement = power;
  const policy = document.createElement("button");
  policy.type = "button";
  policy.textContent = "プライバシーポリシー";
  policy.setAttribute("aria-description", privacyText);
  policy.addEventListener("focus", () => view.inspectPrivacy());
  policy.addEventListener("click", () => view.inspectPrivacy());
  navigation.append(policy);
  const team = document.createElement("a");
  team.href = profile.team.href;
  team.target = "_blank";
  team.rel = "noopener noreferrer";
  team.dataset.paperLink = "team411";
  team.textContent = "team411の公式サイト";
  team.addEventListener("focus", () => view.inspect(1));
  navigation.append(team);
  for (const [label, href] of [
    ["Googleのデータ利用", privacy.google],
    ["計測を停止する", privacy.optout],
  ] as const) {
    const link = document.createElement("button");
    link.type = "button";
    link.textContent = label;
    link.addEventListener("focus", () => view.inspectPrivacy());
    link.addEventListener("click", () => window.open(href, "_blank", "noopener,noreferrer"));
    navigation.append(link);
  }
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
      else if (notice.refreshable) refreshBoard();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const neighbors: Readonly<Record<string, readonly number[]>> = {
        ArrowLeft: [0, 1, 1, 1],
        ArrowRight: [2, 3, 2, 3],
        ArrowUp: [0, 0, 2, 2],
        ArrowDown: [1, 1, 3, 3],
      };
      const nextIndex = neighbors[event.key]?.[index];
      const next = nextIndex === undefined ? undefined : buttons[nextIndex];
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
  screen.addEventListener("focus", () => view.inspectScreen());
  screen.addEventListener("click", () => view.inspectScreen());
  powerButton.addEventListener("focus", () => view.inspectComputer());
  function togglePower(): void {
    const on = computer.togglePower();
    powerButton.setAttribute("aria-pressed", String(on));
    ui.announce(on ? "PCの電源を入れました" : "PCの電源を切りました");
  }
  powerButton.addEventListener("click", togglePower);
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
        : notice.refreshable
          ? `${notice.title}：掲示を再取得`
          : notice.title;
    });
  }
  syncNotices();
  return { syncNotices, toggleLight, togglePower };
}
