import type { Object3D } from "three";

export function bindRoomSwitch(
  lightSwitch: Object3D,
  rocker: Object3D,
  setLights: (on: boolean) => void,
  invalidate: () => void,
) {
  let on = true;
  return {
    object: lightSwitch,
    toggle() {
      on = !on;
      setLights(on);
      rocker.rotation.z = on ? -0.16 : 0.16;
      invalidate();
    },
  };
}
