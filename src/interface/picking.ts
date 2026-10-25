import { Mesh, Raycaster, Vector2 } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";

interface ComputerTargets {
  object: Object3D;
  monitor: Object3D;
  power: Object3D;
  isPowered: () => boolean;
}

export function createPicker(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  scene: Scene,
  papers: readonly Object3D[],
  computer: ComputerTargets,
  lightSwitch: Object3D,
) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  return (event: PointerEvent, occlusion: boolean) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    raycaster.far = Infinity;
    const targets = [...papers, computer.power, lightSwitch];
    if (computer.isPowered()) targets.push(computer.monitor);
    let candidate = raycaster.intersectObjects(targets, true)[0];
    let target: Object3D | undefined;
    if (candidate) {
      for (let owner: Object3D | null = candidate.object; owner; owner = owner.parent) {
        if (targets.includes(owner)) {
          target = owner;
          break;
        }
      }
    }
    const tower = raycaster.intersectObject(computer.object, false)[0];
    if (
      tower &&
      (!candidate ||
        (tower.distance < candidate.distance &&
          target !== computer.power &&
          target !== computer.monitor))
    ) {
      candidate = tower;
      target = computer.object;
    }
    if (!candidate) return;
    if (occlusion) {
      raycaster.far = candidate.distance - 0.0001;
      const blocked = raycaster.intersectObjects(scene.children, true).some(({ object }) => {
        if (!(object instanceof Mesh) || object === computer.object) return false;
        for (let owner: Object3D | null = object; owner; owner = owner.parent)
          if (owner === target) return false;
        return true;
      });
      if (blocked) return;
    }
    if (target === lightSwitch) return { type: "light" as const };
    if (target === computer.object) return { type: "computer" as const };
    if (target === computer.power) return { type: "power" as const };
    if (target === computer.monitor) return { type: "monitor" as const, uv: candidate.uv };
    if (!target) return;
    const index = papers.indexOf(target);
    if (index >= 0) return { type: "notice" as const, index, uv: candidate.uv };
  };
}
