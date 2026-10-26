import { ArrowDownLeft, X, createElement } from "lucide";
import "./control-introduction.css";

export function createControlIntroduction(root: HTMLElement) {
  const key = "akaakuhub:controls-introduction-seen";
  const guide = document.createElement("aside");
  guide.className = "room-control-introduction";
  guide.setAttribute("aria-label", "部屋の操作の案内");
  guide.hidden = true;
  const message = document.createElement("span");
  message.setAttribute("role", "status");
  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "案内を閉じる");
  close.append(createElement(X, { width: 20, height: 20, "aria-hidden": "true" }));
  guide.append(
    message,
    close,
    createElement(ArrowDownLeft, {
      width: 36,
      height: 36,
      class: "room-control-introduction__arrow",
      "aria-hidden": "true",
    }),
  );
  close.addEventListener("click", () => {
    guide.hidden = true;
    root
      .querySelector<HTMLButtonElement>(
        guide.dataset.target === "motion" ? ".room-motion" : ".room-sound",
      )
      ?.focus({ preventScroll: true });
  });
  root.append(guide);
  let seen = localStorage.getItem(key) === "true";
  let sound = false;
  let motion = false;
  let motionAvailable = false;
  let ready = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function update(): void {
    const needed = !sound || (motionAvailable && !motion);
    if (!needed) guide.hidden = true;
    guide.dataset.target = sound && motionAvailable ? "motion" : "sound";
    message.textContent =
      !sound && motionAvailable && !motion
        ? "音やモーションをオンにすると、部屋をもっと楽しめます"
        : !sound
          ? "音をオンにすると、雨や風の音も楽しめます"
          : "モーションをオンにすると、端末の傾きで視点を動かせます";
    clearTimeout(timer);
    if (!ready || seen || !needed || document.hidden) return;
    timer = setTimeout(() => {
      if (document.hidden) return;
      guide.hidden = false;
      localStorage.setItem(key, "true");
      seen = true;
    }, 5000);
  }
  document.addEventListener("visibilitychange", update);
  window.addEventListener("pageshow", update);
  window.addEventListener("pagehide", () => clearTimeout(timer));
  return {
    start(): void {
      ready = true;
      update();
    },
    setSoundEnabled(value: boolean): void {
      sound = value;
      update();
    },
    setMotionEnabled(value: boolean): void {
      motion = value;
      update();
    },
    setMotionAvailable(value: boolean): void {
      motionAvailable = value;
      update();
    },
  };
}
