import type { WebGLRenderer } from "three";

export function bindRenderingErrors(
  renderer: WebGLRenderer,
  canvas: HTMLCanvasElement,
  fail: (error: unknown) => void,
): void {
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    const logs = [
      gl.getProgramInfoLog(program),
      gl.getShaderInfoLog(vertex),
      gl.getShaderInfoLog(fragment),
    ]
      .filter((log) => log !== null && log.length > 0)
      .join("\n");
    throw new Error(`GPUの描画プログラムを準備できませんでした。\n${logs}`);
  };
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail(new Error("GPUとの接続が失われたため、描画を続けられません。"));
  });
}
