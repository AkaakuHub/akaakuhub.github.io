import { describe, expect, it, vi } from "vite-plus/test";
import { FrameScheduler } from "./frame-scheduler";

function fixture() {
  let time = 0;
  let id = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const completions: (() => void)[] = [];
  const render = vi.fn<(time: number, seconds: number) => boolean>(() => true);
  const failed = vi.fn();
  const scheduler = new FrameScheduler(
    render,
    () => new Promise<void>((resolve) => completions.push(resolve)),
    failed,
    {
      now: () => time,
      request(callback) {
        callbacks.set(++id, callback);
        return id;
      },
      cancel: (key) => callbacks.delete(key),
    },
  );
  return {
    scheduler,
    render,
    failed,
    completions,
    callbacks,
    step(delta = 17) {
      time += delta;
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(time);
    },
  };
}

describe("GPUの進行に合わせたフレームの送信", () => {
  it("未完了の送信を2フレームまでに制限し、待ち時間もアニメーションへ渡す", async () => {
    const f = fixture();
    f.scheduler.request();
    f.step();
    f.step();
    f.step();
    f.scheduler.request();
    f.step(50);
    expect(f.render).toHaveBeenCalledTimes(2);
    expect(f.callbacks.size).toBe(0);
    f.completions[0]?.();
    await Promise.resolve();
    f.step();
    expect(f.render).toHaveBeenCalledTimes(3);
    expect(f.render.mock.calls[2]?.[1]).toBeCloseTo(0.084);
  });

  it("静止中の要求をまとめ、GPUの完了だけでは次を描画しない", async () => {
    const f = fixture();
    f.render.mockReturnValue(false);
    f.scheduler.request();
    f.scheduler.request();
    expect(f.callbacks.size).toBe(1);
    f.step();
    f.completions[0]?.();
    await Promise.resolve();
    expect(f.callbacks.size).toBe(0);
    f.step(5000);
    f.scheduler.request();
    f.step();
    expect(f.render.mock.calls[1]?.[1]).toBeLessThan(0.04);
  });

  it("非表示中はGPU待ちが終わっても再開せず、復帰後に描画する", async () => {
    const f = fixture();
    f.scheduler.request();
    f.step();
    f.step();
    f.step();
    f.scheduler.setActive(false);
    f.completions[0]?.();
    await Promise.resolve();
    expect(f.callbacks.size).toBe(0);
    f.scheduler.setActive(true);
    f.scheduler.request();
    f.step();
    expect(f.render).toHaveBeenCalledTimes(3);
  });

  it("描画失敗後は送信を止め、エラーを通知する", () => {
    const f = fixture();
    const error = new Error("描画を完了できませんでした。");
    f.render.mockImplementation(() => {
      throw error;
    });
    f.scheduler.request();
    f.step();
    f.scheduler.request();
    expect(f.failed).toHaveBeenCalledWith(error);
    expect(f.callbacks.size).toBe(0);
  });

  it("GPUの完了通知が失敗した場合も描画を止める", async () => {
    const error = new Error("GPUの処理を完了できませんでした。");
    const failed = vi.fn();
    let callback: FrameRequestCallback | undefined;
    const scheduler = new FrameScheduler(
      () => true,
      () => Promise.reject(error),
      failed,
      {
        now: () => 0,
        request(next) {
          callback = next;
          return 1;
        },
        cancel() {
          callback = undefined;
        },
      },
    );
    scheduler.request();
    callback?.(17);
    await Promise.resolve();
    expect(failed).toHaveBeenCalledWith(error);
    expect(callback).toBeUndefined();
  });
});
