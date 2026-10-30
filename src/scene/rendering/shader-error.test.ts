import { describe, expect, it, vi } from "vite-plus/test";
import { shaderError } from "./shader-error";
import { RenderingContextLostError, RenderingResourcesInvalidError } from "./recovery";

function context() {
  return {
    getError: () => 0,
    isContextLost: () => false,
    isProgram: () => true,
    isShader: () => true,
    getShaderParameter: vi.fn(() => false),
    getProgramParameter: vi.fn(() => false),
    getShaderInfoLog: vi.fn(() => "compile failure"),
    getProgramInfoLog: vi.fn(() => "link failure"),
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
  } satisfies Parameters<typeof shaderError>[0];
}

describe("WebGLの失敗原因の判別", () => {
  it("接続喪失通知より先にオブジェクトが無効になってもコンパイル失敗と混同しない", () => {
    const gl = { ...context(), isProgram: () => false, isShader: () => false };
    const error = shaderError(gl, {}, {}, {});
    expect(error).toBeInstanceOf(RenderingResourcesInvalidError);
    expect(error.message).toContain("Context lost: false");
    expect(error.message).not.toContain("compiled: false");
    expect(gl.getShaderParameter).not.toHaveBeenCalled();
    expect(gl.getProgramParameter).not.toHaveBeenCalled();
    expect(gl.getShaderInfoLog).not.toHaveBeenCalled();
    expect(gl.getProgramInfoLog).not.toHaveBeenCalled();
  });

  it("有効なシェーダーのコンパイル失敗はドライバーの詳細を残す", () => {
    const error = shaderError(context(), {}, {}, {});
    expect(error).not.toBeInstanceOf(RenderingResourcesInvalidError);
    expect(error.message).toContain("compile failure");
    expect(error.message).toContain("link failure");
  });

  it("接続喪失中はシェーダーを検査しない", () => {
    const gl = { ...context(), isContextLost: () => true };
    expect(shaderError(gl, {}, {}, {})).toBeInstanceOf(RenderingContextLostError);
    expect(gl.getShaderParameter).not.toHaveBeenCalled();
  });
});
