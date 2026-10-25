import { bottomClass, controlClass, leftClass, rightClass, topClass } from "./styles";

export const directions = ["ホワイトボード", "窓", "本棚", "ドア", "天井"] as const;

export function roomMarkup(): string {
  return `
    <main class="room relative h-dvh w-full overflow-hidden" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas block size-full touch-none" tabindex="0" aria-label="四方と天井を見回して掲示へ近づける3Dの部室"></canvas>
      <button class="board-action ${controlClass} absolute ${bottomClass} ${rightClass} h-11 gap-2.5 px-3.5 text-xs font-medium whitespace-nowrap [&[hidden]]:hidden">掲示を見る<i data-lucide="scan-search"></i></button>
      <button class="computer-action ${controlClass} absolute ${bottomClass} ${rightClass} h-11 gap-2.5 px-3.5 text-xs font-medium whitespace-nowrap [&[hidden]]:hidden" hidden>PCを見る<i data-lucide="monitor"></i></button>
      <nav class="inspection-navigation pointer-events-none absolute inset-0 [&[hidden]]:hidden" aria-label="拡大表示の操作" hidden>
        <button class="refresh-notices ${controlClass} pointer-events-auto absolute ${topClass} right-[calc(max(1rem,env(safe-area-inset-right))+3.5rem)] size-11" aria-label="掲示のキャッシュを消して再取得" title="掲示を再取得"><i data-lucide="refresh-cw"></i></button>
        <button class="inspection-back ${controlClass} pointer-events-auto absolute ${topClass} ${leftClass} size-11" aria-label="部屋に戻る" title="部屋に戻る"><i data-lucide="undo-2"></i></button>
        <a class="inspection-link ${controlClass} pointer-events-auto absolute ${topClass} ${rightClass} size-11 no-underline aria-disabled:pointer-events-none aria-disabled:opacity-50" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i></a>
        <button class="previous-notice ${controlClass} pointer-events-auto absolute ${bottomClass} ${leftClass} size-11" aria-label="前の紙を見る" title="前の紙を見る"><i data-lucide="chevron-left"></i></button>
        <button class="zoom-notice ${controlClass} pointer-events-auto absolute ${bottomClass} left-[calc(max(1rem,env(safe-area-inset-left))+3.5rem)] h-11 min-w-11 gap-2 px-3 text-xs" aria-label="紙を拡大" title="紙を拡大"><i data-lucide="zoom-in"></i>拡大</button>
        <button class="next-notice ${controlClass} pointer-events-auto absolute ${bottomClass} ${rightClass} size-11" aria-label="次の紙を見る" title="次の紙を見る"><i data-lucide="chevron-right"></i></button>
      </nav>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
      <a class="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(.2rem,env(safe-area-inset-bottom))] text-[10px] text-white/70 no-underline hover:text-white" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a>
    </main>`;
}
