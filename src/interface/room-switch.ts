import { Vector3 } from "three";
import type { Object3D, PerspectiveCamera } from "three";

export function bindRoomSwitch(
  root: HTMLElement,
  lightSwitch: Object3D,
  rocker: Object3D,
  camera: PerspectiveCamera,
  setLights: (on: boolean) => void,
  invalidate: () => void,
) {
  const button = root.querySelector<HTMLButtonElement>(".room-light-switch");
  if (!button) throw new Error("照明スイッチの操作が見つかりません。");
  const point = new Vector3();
  let on = true;
  button.onclick = () => {
    on = !on;
    setLights(on);
    rocker.rotation.z = on ? -0.16 : 0.16;
    button.setAttribute("aria-checked", String(on));
    invalidate();
  };
  return {
    update(enabled = true) {
      camera.updateMatrixWorld();
      lightSwitch.getWorldPosition(point).project(camera);
      button.hidden =
        !enabled || point.z < -1 || point.z > 1 || Math.abs(point.x) > 1 || Math.abs(point.y) > 1;
      button.style.left = `${((point.x + 1) / 2) * root.clientWidth}px`;
      button.style.top = `${((1 - point.y) / 2) * root.clientHeight}px`;
    },
  };
}
