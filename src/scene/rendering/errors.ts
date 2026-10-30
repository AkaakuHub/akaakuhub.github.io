import { setConsoleFunction } from "three";
import type { Renderer } from "three/webgpu";
import { WebGLBackend } from "three/webgpu";
import { RenderingContextLostError } from "./recovery";
import { renderingDiagnostics } from "./session";

export function bindRenderingErrors(renderer: Renderer, fail: (error: unknown) => void): void {
  const context = renderer.backend instanceof WebGLBackend ? renderer.getContext() : null;
  const driver =
    context instanceof WebGL2RenderingContext
      ? context.getExtension("WEBGL_debug_renderer_info")
      : null;
  const environment =
    context instanceof WebGL2RenderingContext
      ? [
          `API: WebGL 2`,
          `GL: ${context.getParameter(context.VERSION)}`,
          `Vendor: ${context.getParameter(context.VENDOR)}`,
          `Renderer: ${context.getParameter(context.RENDERER)}`,
          ...(driver
            ? [
                `GPU vendor: ${context.getParameter(driver.UNMASKED_VENDOR_WEBGL)}`,
                `GPU renderer: ${context.getParameter(driver.UNMASKED_RENDERER_WEBGL)}`,
              ]
            : []),
          `Max texture size: ${context.getParameter(context.MAX_TEXTURE_SIZE)}`,
          `Parallel compile: ${context.getSupportedExtensions()?.includes("KHR_parallel_shader_compile")}`,
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
    const errorCode = gl.getError();
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
          `GL error: 0x${errorCode.toString(16)}`,
          `Context lost: ${gl.isContextLost()}`,
          `Program exists: ${gl.isProgram(program)}`,
          `Vertex exists: ${gl.isShader(vertex)}`,
          `Fragment exists: ${gl.isShader(fragment)}`,
          `GL: ${gl.getParameter(gl.VERSION)}`,
          `Renderer: ${gl.getParameter(gl.RENDERER)}`,
          `Vertex compiled: ${gl.getShaderParameter(vertex, gl.COMPILE_STATUS)}`,
          `Fragment compiled: ${gl.getShaderParameter(fragment, gl.COMPILE_STATUS)}`,
          `Linked: ${gl.getProgramParameter(program, gl.LINK_STATUS)}`,
          `Program: ${gl.getProgramInfoLog(program)?.slice(0, 400)}`,
          `Vertex: ${gl.getShaderInfoLog(vertex)?.slice(0, 400)}`,
          `Fragment: ${gl.getShaderInfoLog(fragment)?.slice(0, 400)}`,
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
    report(
      new RenderingContextLostError(info.api, `${info.message} (reason: ${info.reason})`),
      `${info.api} context lost`,
    );
  };
}
