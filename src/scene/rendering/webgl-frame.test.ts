import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { completeWebGLFrame } from "./webgl-frame";

function context() {
  return {
    SYNC_GPU_COMMANDS_COMPLETE: 37143,
    TIMEOUT_EXPIRED: 37147,
    WAIT_FAILED: 37149,
    fenceSync: vi.fn<WebGL2RenderingContext["fenceSync"]>(() => ({})),
    flush: vi.fn<WebGL2RenderingContext["flush"]>(),
    clientWaitSync: vi.fn<WebGL2RenderingContext["clientWaitSync"]>(() => 37146),
    deleteSync: vi.fn<WebGL2RenderingContext["deleteSync"]>(),
    isContextLost: vi.fn(() => false),
  } satisfies Parameters<typeof completeWebGLFrame>[0];
}

afterEach(() => vi.useRealTimers());

describe("WebGLの描画完了", () => {
  it("接続喪失を通常のシェーダーエラーと区別し、同期オブジェクトを解放する", async () => {
    const gl = context();
    gl.isContextLost.mockReturnValue(true);
    await expect(completeWebGLFrame(gl)).rejects.toMatchObject({
      name: "RenderingContextLostError",
    });
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.clientWaitSync).not.toHaveBeenCalled();
  });
  it("GPUが完了するまで待ち、同期オブジェクトを解放する", async () => {
    vi.useFakeTimers();
    const gl = context();
    gl.clientWaitSync.mockReturnValueOnce(gl.TIMEOUT_EXPIRED);
    let completed = false;
    const frame = completeWebGLFrame(gl).then(() => {
      completed = true;
    });
    await Promise.resolve();
    expect(completed).toBe(false);
    expect(gl.deleteSync).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    await frame;
    expect(completed).toBe(true);
    expect(gl.flush).toHaveBeenCalledOnce();
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.clientWaitSync.mock.calls.every((call) => call[2] === 0)).toBe(true);
  });

  it("完了済みなら次のタイマーを待たない", async () => {
    const gl = context();
    await completeWebGLFrame(gl);
    expect(gl.clientWaitSync).toHaveBeenCalledOnce();
    expect(gl.deleteSync).toHaveBeenCalledOnce();
  });

  it("同期を作成できない場合は失敗を伝える", async () => {
    const gl = context();
    gl.fenceSync.mockReturnValue(null);
    await expect(completeWebGLFrame(gl)).rejects.toThrow("描画完了を確認できません");
    expect(gl.clientWaitSync).not.toHaveBeenCalled();
    expect(gl.deleteSync).not.toHaveBeenCalled();
  });

  it("待機に失敗した場合も同期オブジェクトを解放する", async () => {
    const gl = context();
    gl.clientWaitSync.mockReturnValue(gl.WAIT_FAILED);
    await expect(completeWebGLFrame(gl)).rejects.toThrow("描画完了を確認できません");
    expect(gl.deleteSync).toHaveBeenCalledOnce();
  });
});
