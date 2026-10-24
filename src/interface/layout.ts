import {
  bottomClass,
  controlClass,
  directionClass,
  leftClass,
  rightClass,
  topClass,
} from "./styles";

export const directions = [
  { name: "ホワイトボード", label: "掲示板", icon: "presentation" },
  { name: "窓", label: "窓", icon: "columns-2" },
  { name: "本棚", label: "本棚", icon: "library" },
  { name: "ドア", label: "ドア", icon: "door-closed" },
  { name: "天井", label: "天井", icon: "arrow-up" },
  { name: "床", label: "床", icon: "arrow-down" },
] as const;

export function roomMarkup(): string {
  return `
    <main class="room relative h-dvh w-full overflow-hidden" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas block size-full touch-none" aria-label="6方向を見回して掲示用紙へ近づける3Dの部室"></canvas>
      <header class="room-header pointer-events-none absolute ${topClass} ${rightClass} ${leftClass} flex items-center justify-between [&[hidden]]:hidden">
        <a class="pointer-events-auto flex min-h-11 items-center rounded-sm px-1 text-[17px] font-medium tracking-tight text-[#f5f3e9] no-underline drop-shadow-[0_1px_5px_#000] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f5f3e9]" href="/" aria-label="AkaakuHubのトップ">AkaakuHub</a>
        <button class="fullscreen ${controlClass} pointer-events-auto size-11" aria-label="全画面表示" title="全画面表示"><i data-lucide="maximize"></i></button>
      </header>
      <nav class="navigation absolute ${bottomClass} ${leftClass} grid grid-cols-3 gap-1 [@media(min-width:520px)]:flex [&[hidden]]:hidden" aria-label="部屋の向き">
        ${directions.map(({ name, label, icon }, index) => `<button class="direction ${directionClass}" data-direction="${index}" aria-label="${name}を向く" title="${name}" aria-pressed="${index === 0}"><i data-lucide="${icon}"></i>${label}</button>`).join("")}
      </nav>
      <button class="board-action ${controlClass} absolute ${bottomClass} ${rightClass} h-11 gap-2.5 px-3.5 text-xs font-medium whitespace-nowrap [&[hidden]]:hidden">掲示を見る<i data-lucide="scan-search"></i></button>
      <nav class="inspection-navigation pointer-events-none absolute inset-0 [&[hidden]]:hidden" aria-label="掲示用紙の操作" hidden>
        <button class="inspection-back ${controlClass} pointer-events-auto absolute ${topClass} ${leftClass} size-11" aria-label="部屋に戻る" title="部屋に戻る"><i data-lucide="undo-2"></i></button>
        <a class="inspection-link ${controlClass} pointer-events-auto absolute ${topClass} ${rightClass} size-11 no-underline aria-disabled:pointer-events-none aria-disabled:opacity-50" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i></a>
        <button class="previous-notice ${controlClass} pointer-events-auto absolute ${bottomClass} ${leftClass} size-11" aria-label="前の紙を見る" title="前の紙を見る"><i data-lucide="chevron-left"></i></button>
        <button class="zoom-notice ${controlClass} pointer-events-auto absolute ${bottomClass} left-[calc(max(1rem,env(safe-area-inset-left))+3.5rem)] h-11 min-w-11 gap-2 px-3 text-xs" aria-label="紙を拡大" title="紙を拡大"><i data-lucide="zoom-in"></i>拡大</button>
        <button class="next-notice ${controlClass} pointer-events-auto absolute ${bottomClass} ${rightClass} size-11" aria-label="次の紙を見る" title="次の紙を見る"><i data-lucide="chevron-right"></i></button>
      </nav>
      <button class="room-light-switch absolute z-10 size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-md border border-transparent bg-transparent hover:border-white/50 focus-visible:outline-2 focus-visible:outline-white [&[hidden]]:hidden" role="switch" aria-label="部屋の照明" aria-checked="true" hidden></button>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
    </main>`;
}
