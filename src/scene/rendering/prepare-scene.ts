import { Mesh } from "three";
import type { PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

export async function prepareScene(
  renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
  scene: Scene,
  camera: PerspectiveCamera,
  target: RenderTarget,
  progress: (value: number) => void,
): Promise<void> {
  const meshes: { mesh: Mesh; culled: boolean }[] = [];
  scene.traverseVisible((object) => {
    if (object instanceof Mesh) {
      meshes.push({ mesh: object, culled: object.frustumCulled });
      object.frustumCulled = false;
    }
  });
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  performance.mark("room-shaders-start");
  try {
    await renderer.compileAsync(scene, camera, null, (event) => {
      if (event.total > 0) progress(event.loaded / event.total);
    });
    performance.mark("room-shaders-ready");
  } finally {
    renderer.setRenderTarget(previous);
    for (const { mesh, culled } of meshes) mesh.frustumCulled = culled;
  }
}
