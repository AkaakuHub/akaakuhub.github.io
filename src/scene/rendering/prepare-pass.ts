import type { Camera, Object3D, RenderTarget } from "three";
import type { Renderer } from "three/webgpu";
import type { RoomRenderer } from "./room-renderer";

export async function prepareRenderTargets(
  renderer: Pick<RoomRenderer, "initRenderTarget" | "completedFrame">,
  targets: readonly RenderTarget[],
): Promise<void> {
  for (const target of targets) {
    renderer.initRenderTarget(target);
    await renderer.completedFrame();
  }
}

export async function preparePass(
  renderer: Pick<Renderer, "getRenderTarget" | "setRenderTarget" | "compileAsync">,
  object: Object3D,
  camera: Camera,
  target: RenderTarget,
): Promise<void> {
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  try {
    await renderer.compileAsync(object, camera);
  } finally {
    renderer.setRenderTarget(previous);
  }
}
