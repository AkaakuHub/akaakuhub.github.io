export function showTextVersion(): void {
  const site = document.getElementById("site");
  const app = document.getElementById("app");
  if (!site || !app) throw new Error("表示先が見つかりません。");
  site.hidden = false;
  app.hidden = true;
}

export function showRoomVersion(): void {
  const site = document.getElementById("site");
  const app = document.getElementById("app");
  if (!site || !app) throw new Error("表示先が見つかりません。");
  site.hidden = true;
  app.hidden = false;
}
