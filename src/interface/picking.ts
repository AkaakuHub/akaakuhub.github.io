import { Mesh, Raycaster, Vector2 } from "three";
import type { Object3D, PerspectiveCamera, Scene } from "three";

export function createPicker(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  scene: Scene,
  papers: readonly Object3D[],
  computer: Object3D,
) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const targets = [...papers, computer];
  return (event: PointerEvent, occlusion: boolean) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    raycaster.far = Infinity;
    const candidate = raycaster.intersectObjects(targets, false)[0];
    if (!candidate) return;
    if (occlusion) {
      raycaster.far = candidate.distance - 0.0001;
      const blocked = raycaster
        .intersectObjects(scene.children, true)
        .some(({ object }) => object instanceof Mesh && object !== computer);
      if (blocked) return;
    }
    if (candidate.object === computer) return { type: "computer" as const };
    const index = papers.indexOf(candidate.object);
    if (index >= 0) return { type: "notice" as const, index, uv: candidate.uv };
  };
}
