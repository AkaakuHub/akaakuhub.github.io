import { shaderError } from "./shader-error";
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
  let firstShaderError: Error | undefined;
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    firstShaderError ??= shaderError(gl, program, vertex, fragment);
    report(firstShaderError, "WebGL shader");
    throw firstShaderError;
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
