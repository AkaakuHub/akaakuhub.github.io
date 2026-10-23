import { MathUtils, PerspectiveCamera } from "three";

export function createView(camera: PerspectiveCamera, onTurn: (index: number) => void) {
  let target = 0;
  let current = 0;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function turn(step: number) {
    target += (step * Math.PI) / 2;
    const index = ((Math.round(target / (Math.PI / 2)) % 4) + 4) % 4;
    onTurn(index);
  }
  return {
    turn,
    select(index: number) {
      const now = ((Math.round(target / (Math.PI / 2)) % 4) + 4) % 4;
      const difference = ((index - now + 6) % 4) - 2;
      turn(difference);
    },
    update(delta: number) {
      current = motion.matches ? target : MathUtils.damp(current, target, 7, delta);
      const moving = Math.abs(current - target) > 0.0001;
      if (!moving) current = target;
      camera.rotation.set(0, current, 0);
      return moving;
    },
  };
}
