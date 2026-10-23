import {
  ArrowLeft,
  ArrowRight,
  Columns2,
  DoorClosed,
  Library,
  Maximize,
  Minimize,
  Presentation,
  X,
  createElement,
  createIcons,
} from "lucide";
import type { Notice } from "../scene/board";

const directions = [
  { name: "ホワイトボード", icon: "presentation" },
  { name: "窓", icon: "columns-2" },
  { name: "本棚", icon: "library" },
  { name: "ドア", icon: "door-closed" },
] as const;

export function createInterface(root: HTMLElement) {
  root.innerHTML = `
    <main class="room" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas" aria-label="4方向を見回せる3Dの部室"></canvas>
      <header class="header">
        <a class="wordmark" href="/" aria-label="AkaakuHubのトップ"><span class="status-dot"></span>AkaakuHub</a>
        <button class="icon-button fullscreen" aria-label="全画面表示"><i data-lucide="maximize"></i></button>
      </header>
      <div class="loading" role="status">部室を開けています<span></span></div>
      <nav class="navigation" aria-label="部屋の向き">
        <button class="icon-button turn-left" aria-label="左を向く"><i data-lucide="arrow-left"></i></button>
        <div class="directions">${directions.map(({ name, icon }, index) => `<button class="direction" data-direction="${index}" aria-label="${name}を向く" title="${name}" aria-pressed="${index === 0}"><i data-lucide="${icon}" aria-hidden="true"></i><span class="direction-name">${name}</span></button>`).join("")}</div>
        <button class="icon-button turn-right" aria-label="右を向く"><i data-lucide="arrow-right"></i></button>
      </nav>
      <button class="board-action">掲示を見る<i data-lucide="arrow-right"></i></button>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
      <dialog class="notice-dialog" aria-labelledby="notice-title">
        <div class="notice-header"><button class="icon-button close-dialog" aria-label="閉じる"><i data-lucide="x"></i></button></div>
        <div class="notice-content"></div>
      </dialog>
    </main>`;
  createIcons({
    icons: { ArrowLeft, ArrowRight, Columns2, DoorClosed, Library, Maximize, Presentation, X },
    attrs: { "aria-hidden": "true" },
  });
  const canvas = root.querySelector("canvas");
  const dialog = root.querySelector("dialog");
  const content = root.querySelector(".notice-content");
  const status = root.querySelector(".view-status");
  const action = root.querySelector<HTMLButtonElement>(".board-action");
  if (!canvas || !dialog || !content || !status || !action)
    throw new Error("画面の初期化に失敗しました。");
  root.querySelector(".close-dialog")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
  const fullscreen = root.querySelector<HTMLButtonElement>(".fullscreen");
  fullscreen?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch {
      status.textContent = "この環境では全画面表示を利用できません。";
    }
  });
  if (!document.fullscreenEnabled) fullscreen?.remove();
  document.addEventListener("fullscreenchange", () => {
    const active = document.fullscreenElement === root;
    fullscreen?.setAttribute("aria-label", active ? "全画面表示を終了" : "全画面表示");
    fullscreen?.replaceChildren(
      createElement(active ? Minimize : Maximize, { "aria-hidden": "true" }),
    );
  });
  return {
    canvas,
    dialog,
    ready() {
      root.querySelector(".loading")?.remove();
    },
    setDirection(index: number) {
      root
        .querySelectorAll<HTMLButtonElement>(".direction")
        .forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      const direction = directions[index];
      if (!direction) throw new Error("部屋の向きが見つかりません。");
      status.textContent = `${direction.name}を向いています`;
      action.hidden = index !== 0;
    },
    showNotice(notice: Notice) {
      const title = document.createElement("h1");
      title.id = "notice-title";
      title.textContent = notice.title;
      const body = document.createElement("p");
      body.textContent = notice.body;
      content.replaceChildren(title, body);
      if (notice.link) {
        const link = document.createElement("a");
        link.textContent = notice.link.label;
        link.href = notice.link.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        content.append(link);
      }
      dialog.showModal();
    },
    showBoard(notices: readonly Notice[]) {
      const title = document.createElement("h1");
      title.id = "notice-title";
      title.textContent = "ホワイトボード";
      content.replaceChildren(title);
      notices.forEach((notice) => {
        const button = document.createElement("button");
        button.className = "notice-choice";
        button.textContent = notice.title;
        button.addEventListener("click", () => {
          dialog.close();
          this.showNotice(notice);
        });
        content.append(button);
      });
      dialog.showModal();
    },
  };
}
