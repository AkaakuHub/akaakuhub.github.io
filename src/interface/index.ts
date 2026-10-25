import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Monitor,
  RefreshCw,
  ScanSearch,
  Undo2,
  ZoomIn,
  ZoomOut,
  createElement,
  createIcons,
} from "lucide";
import type { Notice } from "../scene/board";
import type { ViewState } from "../scene/view";
import type { InspectionViewport } from "../scene/view/targets";
import { directions, roomMarkup } from "./layout";

export function createInterface(root: HTMLElement) {
  const loading = root.querySelector<HTMLElement>(".loading");
  if (!loading) throw new Error("読み込み状態の表示先が見つかりません。");
  root.innerHTML = roomMarkup();
  createIcons({
    icons: {
      ChevronLeft,
      ChevronRight,
      ExternalLink,
      Monitor,
      RefreshCw,
      ScanSearch,
      Undo2,
      ZoomIn,
    },
    attrs: { "aria-hidden": "true" },
  });
  const canvas = root.querySelector("canvas");
  const room = root.querySelector("main");
  const status = root.querySelector(".view-status");
  const inspection = root.querySelector<HTMLElement>(".inspection-navigation");
  const link = root.querySelector<HTMLAnchorElement>(".inspection-link");
  const action = root.querySelector<HTMLButtonElement>(".board-action");
  const computerAction = root.querySelector<HTMLButtonElement>(".computer-action");
  const zoom = root.querySelector<HTMLButtonElement>(".zoom-notice");
  const back = root.querySelector<HTMLButtonElement>(".inspection-back");
  if (
    !canvas ||
    !room ||
    !status ||
    !inspection ||
    !link ||
    !action ||
    !computerAction ||
    !back ||
    !zoom
  )
    throw new Error("画面の初期化に失敗しました。");
  room.append(loading);
  let wasInspecting = false;
  let wasMoving = false;
  let announcement = "ホワイトボードを向いています";
  let inspectionName = "紙";
  function setZoom(factor: number): void {
    if (!zoom) throw new Error("掲示の拡大操作が見つかりません。");
    const expanded = factor > 1;
    const label = expanded ? `${inspectionName}全体を表示` : `${inspectionName}を拡大`;
    zoom.setAttribute("aria-label", label);
    zoom.setAttribute("title", label);
    zoom.replaceChildren(
      createElement(expanded ? ZoomOut : ZoomIn, { "aria-hidden": "true" }),
      document.createTextNode(expanded ? "全体" : "拡大"),
    );
  }
  return {
    canvas,
    setZoom,
    inspectionViewport(): InspectionViewport {
      const viewport = canvas.getBoundingClientRect();
      const controls = [...inspection.querySelectorAll<HTMLElement>("button, a")]
        .filter((element) => !element.hidden)
        .map((element) => element.getBoundingClientRect());
      const right = controls.filter(({ x }) => x >= viewport.x + viewport.width / 2);
      const top = controls.filter(({ y }) => y < viewport.y + viewport.height / 2);
      const bottom = controls.filter(({ y }) => y >= viewport.y + viewport.height / 2);
      return {
        width: viewport.width,
        height: viewport.height,
        insetX:
          Math.max(
            back.getBoundingClientRect().left - viewport.left,
            right.length > 0 ? Math.min(...right.map((rect) => viewport.right - rect.right)) : 0,
          ) + 12,
        insetY:
          Math.max(
            ...top.map((rect) => rect.bottom - viewport.top),
            ...bottom.map((rect) => viewport.bottom - rect.top),
          ) + 12,
      };
    },
    setMoving(moving: boolean) {
      if (moving === wasMoving) return;
      wasMoving = moving;
      room.setAttribute("aria-busy", String(moving));
      link.setAttribute("aria-disabled", String(moving));
      link.tabIndex = moving ? -1 : 0;
      if (!moving) status.textContent = announcement;
    },
    setView(state: ViewState, notice?: Notice) {
      const inspecting = state.mode !== "room";
      inspectionName =
        state.mode === "computer" ? "PC" : state.mode === "monitor" ? "モニター" : "紙";
      zoom.hidden = state.mode === "monitor";
      inspection.hidden = !inspecting;
      action.hidden = state.mode !== "room" || state.direction !== 0;
      computerAction.hidden = state.mode !== "room" || state.direction !== 1;
      link.hidden = state.mode !== "notice" || !notice?.link;
      const refresh = root.querySelector<HTMLButtonElement>(".refresh-notices");
      if (refresh) refresh.hidden = state.mode !== "notice" && state.mode !== "monitor";
      inspection
        .querySelectorAll<HTMLElement>(".previous-notice, .next-notice")
        .forEach((button) => {
          button.hidden = state.mode !== "notice";
        });
      if (state.mode === "room") {
        const direction = directions[state.direction];
        announcement = `${direction}を向いています`;
      } else if (state.mode === "notice") {
        if (!notice) throw new Error("掲示用紙の情報が見つかりません。");
        announcement = `${notice.title}を表示しています`;
        if (notice.link) {
          link.href = notice.link.href;
          link.setAttribute("aria-label", notice.link.label);
          link.setAttribute("title", notice.link.label);
        }
      } else {
        announcement =
          state.mode === "monitor" ? "リポジトリ一覧を表示しています" : "PCを表示しています";
      }
      status.textContent = announcement;
      if (wasInspecting !== inspecting) {
        if (inspecting)
          root.querySelector<HTMLButtonElement>(".inspection-back")?.focus({ preventScroll: true });
        else if (!action.hidden) action.focus({ preventScroll: true });
        else if (!computerAction.hidden) computerAction.focus({ preventScroll: true });
        else canvas.focus({ preventScroll: true });
      }
      wasInspecting = inspecting;
    },
  };
}
