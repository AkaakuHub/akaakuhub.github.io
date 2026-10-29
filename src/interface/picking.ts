import { Mesh, Raycaster, Vector2, Vector3 } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";

interface ComputerTargets {
  surfaces: readonly Object3D[];
  power: Object3D;
  screen: Object3D;
}

export function createPicker(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  scene: Scene,
  papers: readonly Object3D[],
  computer: ComputerTargets,
  lightSwitch: Object3D,
  door: { leaf: Object3D; light: Object3D },
) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const powerPoint = new Vector3();
  const projectedPower = new Vector3();
  const computerSurfaces = [...computer.surfaces];
  return (event: PointerEvent, occlusion: boolean) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    raycaster.far = Infinity;
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      computer.power.getWorldPosition(powerPoint);
      projectedPower.copy(powerPoint).project(camera);
      const pixelDistance = Math.hypot(
        ((pointer.x - projectedPower.x) * rect.width) / 2,
        ((pointer.y - projectedPower.y) * rect.height) / 2,
      );
      if (projectedPower.z > -1 && projectedPower.z < 1 && pixelDistance <= 28) {
        const distance = camera.position.distanceTo(powerPoint);
        raycaster.far = distance - 0.15;
        if (
          !occlusion ||
          !raycaster.intersectObjects(scene.children, true).some(({ object }) => object.visible)
        )
          return { type: "power" as const };
        raycaster.far = Infinity;
      }
    }
    const targets = [...papers, computer.power, computer.screen, lightSwitch, door.leaf];
    if (door.light.visible) targets.push(door.light);
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
    const tower = raycaster.intersectObjects(computerSurfaces, true)[0];
    if (
      tower &&
      (!candidate || (tower.distance < candidate.distance && target !== computer.power))
    ) {
      candidate = tower;
      for (let owner: Object3D | null = tower.object; owner; owner = owner.parent) {
        if (computerSurfaces.includes(owner)) {
          target = owner;
          break;
        }
      }
    }
    if (!candidate) return;
    if (occlusion) {
      raycaster.far = candidate.distance - 0.0001;
      const blocked = raycaster.intersectObjects(scene.children, true).some(({ object }) => {
        if (!(object instanceof Mesh) || !object.visible) return false;
        for (let owner: Object3D | null = object; owner; owner = owner.parent)
          if (owner === target) return false;
        return true;
      });
      if (blocked) return;
    }
    if (target === computer.screen) return { type: "screen" as const };
    if (target === door.leaf) return { type: "door" as const };
    if (target === door.light) return { type: "door-light" as const };
    if (target === lightSwitch) return { type: "light" as const };
    if (target && computer.surfaces.includes(target)) return { type: "computer" as const };
    if (target === computer.power) return { type: "power" as const };
    if (!target) return;
    const index = papers.indexOf(target);
    if (index >= 0) return { type: "notice" as const, index, uv: candidate.uv };
  };
}
