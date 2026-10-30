export const directions = ["ホワイトボード", "窓", "奥の壁", "ドア", "天井"] as const;

export function roomMarkup(): string {
  return `
    <main class="room relative h-dvh w-full overflow-hidden" aria-label="AkaakuHubの部室">
      <canvas class="room__canvas block size-full touch-none" tabindex="0" aria-label="3Dの部室。矢印キーで視点を動かし、Tabキーで掲示や設備を選べます"></canvas>
      <nav class="room-keyboard" aria-label="部室の操作対象">
        <div class="room-device-controls"></div>
        <button type="button" data-notice-index="0">プロフィール</button>
        <button type="button" data-notice-index="1">GitHubの掲示</button>
        <button type="button" data-notice-index="2">最新記事</button>
        <button type="button" data-notice-index="3">活動記録</button>
        <button type="button" data-room-light aria-pressed="true">部屋の電気</button>
        <button type="button" data-computer-screen>PC画面</button>
        <button type="button" data-computer-power aria-pressed="false">PCの電源</button>
      </nav>
      <p class="view-status sr-only" aria-live="polite">ホワイトボードを向いています</p>
    </main>`;
}
