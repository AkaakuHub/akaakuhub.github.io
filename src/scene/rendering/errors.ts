import type { Renderer } from "three/webgpu";

export function bindRenderingErrors(renderer: Renderer, fail: (error: unknown) => void): void {
  renderer.onError = (error: unknown) => {
    fail(
      error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : JSON.stringify(error)),
    );
  };
  renderer.onDeviceLost = (info) => {
    fail(new Error(`GPUとの接続が失われました: ${info.message}`));
  };
}
