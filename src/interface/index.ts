import {
  ArrowDown,
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
      ArrowDown,
      ArrowUp,
      ChevronLeft,
      ChevronRight,
      Columns2,
      DoorClosed,
      ExternalLink,
      Library,
      Maximize,
      Presentation,
      ScanSearch,
      Undo2,
      ZoomIn,
    },
    attrs: { "aria-hidden": "true" },
  });
  const canvas = root.querySelector("canvas");
  const room = root.querySelector("main");
  const header = root.querySelector<HTMLElement>(".room-header");
  const status = root.querySelector(".view-status");
  const navigation = root.querySelector<HTMLElement>(".navigation");
  const inspection = root.querySelector<HTMLElement>(".inspection-navigation");
  const link = root.querySelector<HTMLAnchorElement>(".inspection-link");
  const action = root.querySelector<HTMLButtonElement>(".board-action");
  const zoom = root.querySelector<HTMLButtonElement>(".zoom-notice");
  if (
    !canvas ||
    !room ||
    !header ||
    !status ||
    !navigation ||
    !inspection ||
    !link ||
    !action ||
    !zoom
  )
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
    const label = active ? "全画面表示を終了" : "全画面表示";
    fullscreen?.setAttribute("aria-label", label);
    fullscreen?.setAttribute("title", label);
    fullscreen?.replaceChildren(
      createElement(active ? Minimize : Maximize, { "aria-hidden": "true" }),
    );
  });
  let wasInspecting = false;
  let wasMoving = false;
  let announcement = "ホワイトボードを向いています";
  function setZoom(factor: number): void {
    if (!zoom) throw new Error("掲示の拡大操作が見つかりません。");
    const expanded = factor > 1;
    const label = expanded ? "紙全体を表示" : "紙を拡大";
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
      const controls = [...inspection.querySelectorAll<HTMLElement>("button, a")].map((element) =>
        element.getBoundingClientRect(),
      );
      const left = controls.filter(({ x }) => x < viewport.x + viewport.width / 2);
      const right = controls.filter(({ x }) => x >= viewport.x + viewport.width / 2);
      const top = controls.filter(({ y }) => y < viewport.y + viewport.height / 2);
      const bottom = controls.filter(({ y }) => y >= viewport.y + viewport.height / 2);
      return {
        width: viewport.width,
        height: viewport.height,
        insetX:
          Math.max(
            ...left.map((rect) => rect.right - viewport.left),
            ...right.map((rect) => viewport.right - rect.left),
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
      const inspecting = state.mode === "notice";
      navigation.hidden = inspecting;
      inspection.hidden = !inspecting;
      header.hidden = inspecting;
      action.hidden = inspecting || state.direction !== 0;
      if (state.mode === "room") {
        const direction = directions[state.direction];
        announcement = `${direction.name}を向いています`;
        root
          .querySelectorAll<HTMLButtonElement>(".direction")
          .forEach((button, index) =>
            button.setAttribute("aria-pressed", String(index === state.direction)),
          );
      } else {
        if (!notice) throw new Error("掲示用紙の情報が見つかりません。");
        announcement = `${notice.title}を表示しています`;
        link.href = notice.link.href;
        link.setAttribute("aria-label", notice.link.label);
        link.setAttribute("title", notice.link.label);
        setZoom(1);
      }
      status.textContent = announcement;
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
