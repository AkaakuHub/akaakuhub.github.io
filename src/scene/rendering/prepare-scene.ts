import { Mesh } from "three";
import type { PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";
import { prepareShadows } from "./prepare-shadows";

export async function prepareScene(
  renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
  scene: Scene,
  camera: PerspectiveCamera,
  target: RenderTarget,
  progress: (value: number) => void,
): Promise<void> {
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  const meshes: { object: Mesh; culled: boolean }[] = [];
  scene.traverseVisible((object) => {
    if (object instanceof Mesh) {
      meshes.push({ object, culled: object.frustumCulled });
      object.frustumCulled = false;
    }
  });
  performance.mark("room-shaders-start");
  try {
    await renderer.compileAsync(scene, camera, null, (event) => {
      if (event.total > 0) progress(event.loaded / event.total);
    });
    await prepareShadows(renderer, scene);
    performance.mark("room-shaders-ready");
  } finally {
    for (const { object, culled } of meshes) object.frustumCulled = culled;
    renderer.setRenderTarget(previous);
  }
}
