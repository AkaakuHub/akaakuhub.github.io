import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns2,
  DoorClosed,
  ExternalLink,
  Library,
  Maximize,
  Minimize,
  Presentation,
  Undo2,
  createElement,
  createIcons,
} from "lucide";
import type { Notice } from "../scene/board";
import type { ViewState } from "../scene/view";
import { controlClass, panelClass } from "./styles";

const directions = [
  { name: "ホワイトボード", icon: "presentation" },
  { name: "窓", icon: "columns-2" },
  { name: "本棚", icon: "library" },
  { name: "ドア", icon: "door-closed" },
  { name: "天井", icon: "arrow-up" },
  { name: "床", icon: "arrow-down" },
] as const;

export function createInterface(root: HTMLElement) {
  const loading = root.querySelector<HTMLElement>(".loading");
  if (!loading) throw new Error("読み込み状態の表示先が見つかりません。");
  root.innerHTML = `
    <main class="room relative h-dvh w-full overflow-hidden" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas block size-full touch-none" aria-label="6方向を見回して掲示用紙へ近づける3Dの部室"></canvas>
      <header class="pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] flex items-center justify-between md:top-[max(1.5rem,env(safe-area-inset-top))] md:right-[max(1.5rem,env(safe-area-inset-right))] md:left-[max(1.5rem,env(safe-area-inset-left))]">
        <a class="pointer-events-auto flex min-h-11 items-center gap-2.5 rounded-full border border-white/70 bg-[#f8f6ee]/95 px-3.5 text-[17px] font-semibold tracking-tight text-[#293c32] no-underline backdrop-blur-lg focus-visible:outline-2 focus-visible:outline-[#567565] md:text-[19px]" href="/" aria-label="AkaakuHubのトップ"><span class="size-2 rounded-full bg-[#5b7864]"></span>AkaakuHub</a>
        <button class="fullscreen ${controlClass} pointer-events-auto border border-white/50 bg-[#f6f4ea]/80 backdrop-blur-lg" aria-label="全画面表示"><i data-lucide="maximize"></i></button>
      </header>
      <nav class="navigation ${panelClass}" aria-label="部屋の向き">
        <button class="turn-left ${controlClass} hidden md:inline-flex" aria-label="左を向く"><i data-lucide="arrow-left"></i></button>
        <div class="flex items-center gap-0.5 md:gap-1">${directions.map(({ name, icon }, index) => `<button class="direction flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full p-3 transition-colors hover:bg-[#354437]/5 focus-visible:outline-2 focus-visible:outline-[#567565] aria-pressed:bg-[#dce4d8] aria-pressed:text-[#315341] [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0" data-direction="${index}" aria-label="${name}を向く" title="${name}" aria-pressed="${index === 0}"><i data-lucide="${icon}" aria-hidden="true"></i><span class="hidden whitespace-nowrap text-xs font-medium tracking-wide md:inline">${name}</span></button>`).join("")}</div>
        <button class="turn-right ${controlClass} hidden md:inline-flex" aria-label="右を向く"><i data-lucide="arrow-right"></i></button>
      </nav>
      <button class="board-action absolute bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] left-1/2 flex min-h-11 -translate-x-1/2 cursor-pointer touch-manipulation items-center justify-center gap-4 rounded-md border border-white/60 bg-[#faf7ec]/90 px-4.5 py-2.5 text-xs whitespace-nowrap shadow-sm backdrop-blur-lg hover:bg-[#fffdf7] focus-visible:outline-2 focus-visible:outline-[#567565] [@media(max-height:440px)_and_(min-width:600px)]:top-[max(1rem,env(safe-area-inset-top))] [@media(max-height:440px)_and_(min-width:600px)]:bottom-auto [&_svg]:size-3.5">掲示を見る<i data-lucide="arrow-right"></i></button>
      <nav class="inspection-navigation ${panelClass}" aria-label="掲示用紙の操作" hidden>
        <button class="inspection-back ${controlClass}" aria-label="部屋に戻る" title="部屋に戻る"><i data-lucide="undo-2"></i></button>
        <button class="previous-notice ${controlClass}" aria-label="前の紙を見る" title="前の紙を見る"><i data-lucide="chevron-left"></i></button>
        <button class="next-notice ${controlClass}" aria-label="次の紙を見る" title="次の紙を見る"><i data-lucide="chevron-right"></i></button>
        <a class="inspection-link flex min-h-11 items-center justify-center gap-2 border-l border-[#b7bcae] px-3.5 text-xs font-medium whitespace-nowrap text-[#254e3a] no-underline hover:text-[#111f16] focus-visible:outline-2 focus-visible:outline-[#567565] aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4" target="_blank" rel="noopener noreferrer"></a>
      </nav>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
    </main>`;
  createIcons({
    icons: {
      ArrowDown,
      ArrowLeft,
      ArrowRight,
      ArrowUp,
      ChevronLeft,
      ChevronRight,
      Columns2,
      DoorClosed,
      Library,
      Maximize,
      Presentation,
      Undo2,
    },
    attrs: { "aria-hidden": "true" },
  });
  const canvas = root.querySelector("canvas");
  const room = root.querySelector("main");
  const status = root.querySelector(".view-status");
  const navigation = root.querySelector<HTMLElement>(".navigation");
  const inspection = root.querySelector<HTMLElement>(".inspection-navigation");
  const link = root.querySelector<HTMLAnchorElement>(".inspection-link");
  const action = root.querySelector<HTMLButtonElement>(".board-action");
  if (!canvas || !room || !status || !navigation || !inspection || !link || !action)
    throw new Error("画面の初期化に失敗しました。");
  room.append(loading);
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
  let wasInspecting = false;
  let wasMoving = false;
  return {
    canvas,
    ready() {
      loading.remove();
    },
    setMoving(moving: boolean) {
      if (moving === wasMoving) return;
      wasMoving = moving;
      room.setAttribute("aria-busy", String(moving));
      link.setAttribute("aria-disabled", String(moving));
    },
    setView(state: ViewState, notice?: Notice) {
      const inspecting = state.mode === "notice";
      navigation.hidden = inspecting;
      inspection.hidden = !inspecting;
      action.hidden = inspecting || state.direction !== 0;
      if (state.mode === "room") {
        const direction = directions[state.direction];
        status.textContent = `${direction.name}を向いています`;
        root
          .querySelectorAll<HTMLButtonElement>(".direction")
          .forEach((button, index) =>
            button.setAttribute("aria-pressed", String(index === state.direction)),
          );
      } else {
        if (!notice) throw new Error("掲示用紙の情報が見つかりません。");
        status.textContent = `${notice.title}へ近づいています`;
        link.href = notice.link.href;
        link.replaceChildren(
          document.createTextNode(notice.link.label),
          createElement(ExternalLink, { "aria-hidden": "true" }),
        );
      }
      if (wasInspecting !== inspecting) {
        if (inspecting)
          root.querySelector<HTMLButtonElement>(".inspection-back")?.focus({ preventScroll: true });
        else if (!action.hidden) action.focus({ preventScroll: true });
        else
          root
            .querySelector<HTMLButtonElement>(".direction[aria-pressed=true]")
            ?.focus({ preventScroll: true });
      }
      wasInspecting = inspecting;
    },
  };
}
