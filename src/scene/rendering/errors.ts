import { setConsoleFunction } from "three";
import type { Renderer } from "three/webgpu";

export function bindRenderingErrors(renderer: Renderer, fail: (error: unknown) => void): void {
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    fail(
      new Error(
        [
          "WebGLのシェーダーを準備できませんでした。",
          `Program: ${gl.getProgramInfoLog(program)}`,
          `Vertex: ${gl.getShaderInfoLog(vertex)}`,
          `Fragment: ${gl.getShaderInfoLog(fragment)}`,
          `Vertex source:\n${gl.getShaderSource(vertex)}`,
          `Fragment source:\n${gl.getShaderSource(fragment)}`,
        ].join("\n\n"),
      ),
    );
  };
  setConsoleFunction((type, message, ...details) => {
    if (type === "error") fail(new Error(message, { cause: details }));
    else console[type](message, ...details);
  });
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
