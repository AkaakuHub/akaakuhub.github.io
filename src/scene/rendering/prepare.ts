import { HalfFloatType, RenderTarget } from "three";
import type { PerspectiveCamera, Scene } from "three";
import type { Renderer } from "three/webgpu";

export async function prepareRoomShaders(
  renderer: Renderer,
  scene: Scene,
  camera: PerspectiveCamera,
  onProgress: (event: ProgressEvent) => void,
): Promise<void> {
  const target = new RenderTarget(1, 1, { type: HalfFloatType });
  const previous = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    await renderer.compileAsync(scene, camera, scene, onProgress);
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
  }
}
