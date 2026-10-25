import { bottomClass, controlClass, rightClass } from "./styles";

export const directions = ["ホワイトボード", "窓", "本棚", "ドア", "天井"] as const;

export function roomMarkup(): string {
  return `
    <main class="room relative h-dvh w-full overflow-hidden" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas block size-full touch-none" tabindex="0" aria-label="視点を動かして掲示や部屋の設備を見る3Dの部室"></canvas>
      <button class="board-action ${controlClass} absolute ${bottomClass} ${rightClass} h-11 gap-2.5 px-3.5 text-xs font-medium whitespace-nowrap [&[hidden]]:hidden">掲示を見る<i data-lucide="scan-search"></i></button>
      <button class="computer-action ${controlClass} absolute ${bottomClass} ${rightClass} h-11 gap-2.5 px-3.5 text-xs font-medium whitespace-nowrap [&[hidden]]:hidden" hidden>PCを見る<i data-lucide="monitor"></i></button>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
      <a class="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(.2rem,env(safe-area-inset-bottom))] text-[10px] text-white/70 no-underline hover:text-white" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a>
    </main>`;
}
