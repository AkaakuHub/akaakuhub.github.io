import type { PerspectiveCamera, RenderTarget, Scene } from "three";
import type { Renderer } from "three/webgpu";

export async function prepareScene(
  renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
  scene: Scene,
  camera: PerspectiveCamera,
  target: RenderTarget,
  progress: (value: number) => void,
): Promise<void> {
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
  }
}
