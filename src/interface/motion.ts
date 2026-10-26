import { Smartphone, createElement } from "lucide";
import { createMotionSource } from "../motion/source";
import type { createControlIntroduction } from "./control-introduction";
import "./motion.css";

export function bindMotionControl(
  root: HTMLElement,
  setTilt: (x: number, y: number) => void,
  announce: (message: string) => void,
  introduction: ReturnType<typeof createControlIntroduction>,
): void {
  const navigation = root.querySelector(".room-keyboard");
  if (!navigation) throw new Error("モーション操作の配置先が見つかりません。");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "room-motion room-device-control";
  button.hidden = true;
  button.setAttribute("aria-label", "モーション操作");
  button.setAttribute("aria-pressed", "false");
  button.title = "モーション操作をオン";
  button.append(createElement(Smartphone, { width: 22, height: 22, "aria-hidden": "true" }));
  let enabled = false;
  const source = createMotionSource(
    setTilt,
    (available) => {
      button.hidden = !available;
      introduction.setMotionAvailable(available);
    },
    (value) => {
      enabled = value;
      button.setAttribute("aria-pressed", String(value));
      button.title = value ? "モーション操作をオフ" : "モーション操作をオン";
      introduction.setMotionEnabled(value);
    },
  );
  if (!source) return;
  button.addEventListener("click", async () => {
    if (enabled) {
      source.disable();
      return;
    }
    button.disabled = true;
    try {
      if (!(await source.enable())) announce("モーション操作は許可されませんでした。");
    } catch (error) {
      console.error(error);
      source.disable();
      announce("モーション操作を開始できませんでした。");
    } finally {
      button.disabled = false;
    }
  });
  navigation.append(button);
}
