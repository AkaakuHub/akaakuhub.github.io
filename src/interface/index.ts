import { Monitor, ScanSearch, createIcons } from "lucide";
import type { Notice } from "../scene/board";
import type { ViewState } from "../scene/view";
import type { InspectionViewport } from "../scene/view/targets";
import { directions, roomMarkup } from "./layout";

export function createInterface(root: HTMLElement) {
  const loading = root.querySelector<HTMLElement>(".loading");
  if (!loading) throw new Error("読み込み表示先が見つかりません。");
  root.innerHTML = roomMarkup();
  createIcons({ icons: { Monitor, ScanSearch }, attrs: { "aria-hidden": "true" } });
  const canvas = root.querySelector("canvas");
  const room = root.querySelector("main");
  const status = root.querySelector(".view-status");
  const action = root.querySelector<HTMLButtonElement>(".board-action");
  const computerAction = root.querySelector<HTMLButtonElement>(".computer-action");
  if (!canvas || !room || !status || !action || !computerAction)
    throw new Error("画面の初期化に失敗しました。");
  room.append(loading);
  let wasInspecting = false;
  let wasMoving = false;
  let announcement = "ホワイトボードを向いています";
  return {
    canvas,
    inspectionViewport(): InspectionViewport {
      const viewport = canvas.getBoundingClientRect();
      return { width: viewport.width, height: viewport.height, insetX: 12, insetY: 12 };
    },
    setMoving(moving: boolean) {
      if (moving === wasMoving) return;
      wasMoving = moving;
      room.setAttribute("aria-busy", String(moving));
      if (!moving) status.textContent = announcement;
    },
    setView(state: ViewState, notice?: Notice) {
      const inspecting = state.mode !== "room";
      action.hidden = state.mode !== "room" || state.direction !== 0;
      computerAction.hidden = state.mode !== "room" || state.direction !== 1;
      if (state.mode === "room") {
        announcement = `${directions[state.direction]}を向いています`;
      } else if (state.mode === "notice") {
        if (!notice) throw new Error("掲示の情報が見つかりません。");
        announcement = `${notice.title}を表示しています`;
      } else {
        announcement =
          state.mode === "monitor" ? "リポジトリ一覧を表示しています" : "PCを表示しています";
      }
      status.textContent = announcement;
      if (wasInspecting && !inspecting) canvas.focus({ preventScroll: true });
      wasInspecting = inspecting;
    },
  };
}
