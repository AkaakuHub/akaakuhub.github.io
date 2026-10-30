import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { Object3D, PerspectiveCamera } from "three";
import type { createView } from "../../scene/view";
import { passageApproach, passageJourneyAt } from "../../scene/view/passage-journey";
import "./passage.css";
import type { RoomDirection } from "../../scene/view/targets";

interface Opening {
  panel: Object3D;
  destination: Object3D;
  setAmount: (amount: number) => void;
  label: string;
  direction: RoomDirection;
  color: string;
  enterLabel: string;
  enteringMessage: string;
}

export function createPassageInterface(
  root: HTMLElement,
  camera: PerspectiveCamera,
  view: ReturnType<typeof createView>,
  opening: Opening,
  requestRender: (geometryChanged: boolean) => void,
  announce: (message: string) => void,
) {
  const room = root.querySelector<HTMLElement>(".room");
  const navigation = root.querySelector<HTMLElement>(".room-keyboard");
  if (!room || !navigation) throw new Error("出入口操作の配置先が見つかりません。");
  const roomElement = room;
  const fade = document.createElement("div");
  fade.className = "passage-fade";
  fade.style.backgroundColor = opening.color;
  fade.hidden = true;
  fade.setAttribute("aria-hidden", "true");
  root.append(fade);
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.textContent = `${opening.label}を開ける`;
  toggleButton.setAttribute("aria-expanded", "false");
  const enterButton = document.createElement("button");
  enterButton.type = "button";
  enterButton.textContent = opening.enterLabel;
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
    if (view.locked || view.restricted) return;
    opened = !opened;
    opening.destination.visible = opened || amount > 0;
    enterButton.hidden = true;
    enterButton.disabled = true;
    toggleButton.textContent = opened ? `${opening.label}を閉める` : `${opening.label}を開ける`;
    toggleButton.setAttribute("aria-expanded", String(opened));
    announce(opened ? `${opening.label}を開けました` : `${opening.label}を閉めました`);
    requestRender(false);
  }
  function enter(): void {
    if (!opened || amount !== 1 || view.locked || view.restricted) return;
    camera.updateMatrixWorld();
    start.copy(camera.position);
    startRotation.copy(camera.quaternion);
    destination.copy(passageApproach(opening.destination, start.y));
    direction.setFromRotationMatrix(look.lookAt(start, destination, camera.up));
    journey = 0;
    respawned = false;
    view.lock();
    roomElement.inert = true;
    fade.hidden = false;
    fade.style.opacity = "0";
    announce(opening.enteringMessage);
    requestRender(false);
  }
  toggleButton.addEventListener("focus", () => view.select(opening.direction));
  enterButton.addEventListener("focus", () => view.select(opening.direction));
  toggleButton.addEventListener("click", toggle);
  enterButton.addEventListener("click", enter);

  return {
    targets: { panel: opening.panel, destination: opening.destination },
    toggle,
    enter,
    update(delta: number): boolean {
      if (journey !== undefined) {
        journey += Math.min(delta, 1 / 30);
        const pose = passageJourneyAt(journey, reducedMotion.matches);
        fade.style.opacity = String(pose.opacity);
        const arriving = !respawned && pose.respawn;
        if (arriving) {
          view.respawn();
          view.lock();
          respawned = true;
          opened = false;
          amount = 0;
          opening.setAmount(0);
          opening.destination.visible = false;
          enterButton.hidden = true;
          enterButton.disabled = true;
          toggleButton.textContent = `${opening.label}を開ける`;
          toggleButton.setAttribute("aria-expanded", "false");
        } else if (!respawned) {
          camera.position.lerpVectors(start, destination, pose.travel);
          camera.quaternion.slerpQuaternions(startRotation, direction, pose.turn);
        }
        if (pose.done) {
          journey = undefined;
          view.unlock();
          roomElement.inert = false;
          fade.hidden = true;
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
      opening.setAmount(MathUtils.smootherstep(amount, 0, 1));
      opening.destination.visible = amount > 0;
      enterButton.hidden = amount !== 1;
      enterButton.disabled = amount !== 1;
      requestRender(true);
      return amount !== target;
    },
  };
}
