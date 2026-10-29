import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import type { assembleClubroom } from "../scene/clubroom";
import type { createView } from "../scene/view";
import { doorJourneyAt } from "../scene/view/door-journey";
import "./door.css";

export function createDoorInterface(
  root: HTMLElement,
  camera: PerspectiveCamera,
  view: ReturnType<typeof createView>,
  door: Awaited<ReturnType<typeof assembleClubroom>>["door"],
  requestRender: (doorMoved: boolean) => void,
  announce: (message: string) => void,
) {
  const room = root.querySelector<HTMLElement>(".room");
  const navigation = root.querySelector<HTMLElement>(".room-keyboard");
  if (!room || !navigation) throw new Error("ドア操作の配置先が見つかりません。");
  const doorway = room;
  const white = document.createElement("div");
  white.className = "door-whiteout";
  white.hidden = true;
  white.setAttribute("aria-hidden", "true");
  root.append(white);
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.textContent = "ドアを開ける";
  toggleButton.setAttribute("aria-expanded", "false");
  const enterButton = document.createElement("button");
  enterButton.type = "button";
  enterButton.textContent = "ドアの先の光へ進む";
  enterButton.hidden = true;
  enterButton.disabled = true;
  navigation.append(toggleButton, enterButton);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const start = new Vector3();
  const destination = new Vector3();
  const startRotation = new Quaternion();
  const direction = new Quaternion();
  const look = new Matrix4();
  let opened = false;
  let amount = 0;
  let journey: number | undefined;
  let respawned = false;

  function toggle(): void {
    if (view.locked) return;
    opened = !opened;
    door.light.visible = opened || amount > 0;
    enterButton.hidden = true;
    enterButton.disabled = true;
    toggleButton.textContent = opened ? "ドアを閉める" : "ドアを開ける";
    toggleButton.setAttribute("aria-expanded", String(opened));
    announce(opened ? "ドアを開けました" : "ドアを閉めました");
    requestRender(false);
  }
  function enter(): void {
    if (!opened || amount !== 1 || view.locked) return;
    camera.updateMatrixWorld();
    start.copy(camera.position);
    startRotation.copy(camera.quaternion);
    door.light.getWorldPosition(destination);
    destination.y = start.y;
    destination.x -= 0.14;
    direction.setFromRotationMatrix(look.lookAt(start, destination, camera.up));
    journey = 0;
    respawned = false;
    view.lock();
    doorway.inert = true;
    white.hidden = false;
    white.style.opacity = "0";
    announce("光へ進んでいます");
    requestRender(false);
  }
  toggleButton.addEventListener("focus", () => view.select(3));
  enterButton.addEventListener("focus", () => view.select(3));
  toggleButton.addEventListener("click", toggle);
  enterButton.addEventListener("click", enter);

  return {
    targets: { leaf: door.leaf, light: door.light },
    toggle,
    enter,
    update(delta: number): boolean {
      if (journey !== undefined) {
        journey += Math.min(delta, 1 / 30);
        const pose = doorJourneyAt(journey, reducedMotion.matches);
        white.style.opacity = String(pose.white);
        const arriving = !respawned && pose.respawn;
        if (arriving) {
          view.respawn();
          view.lock();
          respawned = true;
          opened = false;
          amount = 0;
          door.pivot.rotation.y = 0;
          door.light.visible = false;
          enterButton.hidden = true;
          enterButton.disabled = true;
          toggleButton.textContent = "ドアを開ける";
          toggleButton.setAttribute("aria-expanded", "false");
        } else if (!respawned) {
          camera.position.lerpVectors(start, destination, pose.travel);
          camera.quaternion.slerpQuaternions(startRotation, direction, pose.turn);
        }
        if (pose.done) {
          journey = undefined;
          view.unlock();
          doorway.inert = false;
          white.hidden = true;
          const canvas = root.querySelector("canvas");
          canvas?.focus({ preventScroll: true });
          announce("初期地点へ戻りました");
        }
        requestRender(arriving);
        return !respawned && !reducedMotion.matches;
      }
      const target = opened ? 1 : 0;
      if (amount === target) return false;
      const step = reducedMotion.matches ? 1 : Math.min(delta, 1 / 30) / 0.75;
      amount = MathUtils.clamp(amount + (opened ? step : -step), 0, 1);
      door.pivot.rotation.y = MathUtils.smootherstep(amount, 0, 1) * Math.PI * 0.56;
      door.light.visible = amount > 0;
      enterButton.hidden = amount !== 1;
      enterButton.disabled = amount !== 1;
      requestRender(true);
      return amount !== target;
    },
  };
}
