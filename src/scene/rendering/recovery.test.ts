import { describe, expect, it, vi } from "vite-plus/test";
import { RenderingContextLostError, RenderingRecovery } from "./recovery";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("描画方式の復旧", () => {
  it("WebGLの接続喪失でも1回だけ起動し直し、次の失敗は呼び出し元へ返す", () => {
    const saved = storage();
    const reload = vi.fn();
    const first = new RenderingRecovery(saved, reload);
    first.setWebGPUActive(false);
    const error = new RenderingContextLostError("WebGL", "Unknown reason");
    expect(first.recover(error)).toBe(true);
    expect(first.recover(error)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    const second = new RenderingRecovery(saved, reload);
    expect(second.forceWebGL).toBe(true);
    expect(second.recover(error)).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
  it("初回はWebGPUを優先する", () => {
    const reload = vi.fn();
    expect(new RenderingRecovery(storage(), reload).forceWebGL).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([
    new DOMException("Instance dropped in popErrorScope", "OperationError"),
    new Error("A valid external Instance reference no longer exists."),
    "Instance dropped in popErrorScope",
  ])("WebGPUの終了時は次の起動をWebGLに切り替える: %s", (error) => {
    const saved = storage();
    const reload = vi.fn(() => {
      expect(new RenderingRecovery(saved, vi.fn()).forceWebGL).toBe(true);
    });
    const recovery = new RenderingRecovery(saved, reload);
    expect(recovery.recover(error)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("描画中の失敗と切断通知が重なっても再読み込みは1回だけにする", () => {
    const reload = vi.fn();
    const recovery = new RenderingRecovery(storage(), reload);
    expect(recovery.retryWebGL()).toBe(true);
    expect(recovery.recover(new Error("Instance dropped in popErrorScope"))).toBe(true);
    expect(recovery.retryWebGL()).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("起動し直したWebGLで失敗しても再読み込みを繰り返さない", () => {
    const saved = storage();
    new RenderingRecovery(saved, vi.fn()).retryWebGL();
    const reload = vi.fn();
    const recovery = new RenderingRecovery(saved, reload);
    expect(recovery.forceWebGL).toBe(true);
    expect(recovery.recover(new Error("Instance dropped in popErrorScope"))).toBe(false);
    expect(recovery.retryWebGL()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("最初からWebGLを選択した場合はGPUの復旧を開始しない", () => {
    const reload = vi.fn();
    const recovery = new RenderingRecovery(storage(), reload);
    recovery.setWebGPUActive(false);
    expect(recovery.retryWebGL()).toBe(false);
    expect(recovery.recover(new Error("Instance dropped in popErrorScope"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([new TypeError("通信失敗"), new Error("画像の形式が不正です。"), null])(
    "描画方式と関係のないエラーでは再読み込みしない: %s",
    (error) => {
      const reload = vi.fn();
      const recovery = new RenderingRecovery(storage(), reload);
      expect(recovery.recover(error)).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    },
  );
});
