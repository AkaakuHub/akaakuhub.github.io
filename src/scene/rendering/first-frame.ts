import type { Renderer } from "three/webgpu";

export async function finishFirstFrame(renderer: Renderer): Promise<void> {
  const backend = renderer.backend;
  if (!("device" in backend) || !(backend.device instanceof GPUDevice))
    throw new Error("初回描画のGPUを確認できませんでした。");
  await backend.device.queue.onSubmittedWorkDone();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
