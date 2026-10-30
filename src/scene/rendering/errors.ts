import { setConsoleFunction } from "three";
import type { Renderer } from "three/webgpu";
import { WebGLBackend } from "three/webgpu";
import { RenderingContextLostError } from "./recovery";
import { renderingDiagnostics } from "./session";

export function bindRenderingErrors(renderer: Renderer, fail: (error: unknown) => void): void {
  const context = renderer.backend instanceof WebGLBackend ? renderer.getContext() : null;
  const environment =
    context instanceof WebGL2RenderingContext
      ? [
          `API: WebGL 2`,
          `GL: ${context.getParameter(context.VERSION)}`,
          `Vendor: ${context.getParameter(context.VENDOR)}`,
          `Renderer: ${context.getParameter(context.RENDERER)}`,
          `Max texture size: ${context.getParameter(context.MAX_TEXTURE_SIZE)}`,
          `Extensions: ${context.getSupportedExtensions()?.join(", ")}`,
        ].join("\n")
      : "API: WebGPU";
  const report = (error: unknown, source: string): void => {
    renderingDiagnostics.record(
      error,
      source,
      [
        environment,
        `Drawing buffer: ${renderer.domElement.width}x${renderer.domElement.height}`,
        `Geometries: ${renderer.info.memory.geometries}`,
        `Textures: ${renderer.info.memory.textures}`,
      ].join("\n"),
    );
    fail(error);
  };
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    if (gl.isContextLost()) {
      renderingDiagnostics.record(
        new RenderingContextLostError("WebGL", "接続喪失中にシェーダーの検査が呼ばれました。"),
        "WebGL shader check after context loss",
      );
      return;
    }
    report(
      new Error(
        [
          "WebGLのシェーダーを準備できませんでした。",
          `Context lost: ${gl.isContextLost()}`,
          `GL: ${gl.getParameter(gl.VERSION)}`,
          `Renderer: ${gl.getParameter(gl.RENDERER)}`,
          `Vertex compiled: ${gl.getShaderParameter(vertex, gl.COMPILE_STATUS)}`,
          `Fragment compiled: ${gl.getShaderParameter(fragment, gl.COMPILE_STATUS)}`,
          `Linked: ${gl.getProgramParameter(program, gl.LINK_STATUS)}`,
          `Program: ${gl.getProgramInfoLog(program)}`,
          `Vertex: ${gl.getShaderInfoLog(vertex)}`,
          `Fragment: ${gl.getShaderInfoLog(fragment)}`,
          `Vertex source:\n${gl.getShaderSource(vertex)}`,
          `Fragment source:\n${gl.getShaderSource(fragment)}`,
        ].join("\n\n"),
      ),
      "WebGL shader",
    );
  };
  setConsoleFunction((type, message, ...details) => {
    if (type === "error") report(new Error(message, { cause: details }), "Three.js console");
    else console[type](message, ...details);
  });
  renderer.onError = (error: unknown) => {
    report(
      error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : JSON.stringify(error)),
      "Renderer error",
    );
  };
  renderer.onDeviceLost = (info) => {
    report(new RenderingContextLostError(info.api, info.message), `${info.api} context lost`);
  };
}
