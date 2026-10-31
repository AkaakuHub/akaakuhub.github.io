import { describe, expect, it, vi } from "vite-plus/test";
import { waitForTextureUpload } from "./texture-upload";

describe("画像のGPU転送", () => {
  it("操作とシェーダー準備が終わり、GPUの処理が完了したフレームで転送を許可する", async () => {
    let frames = 0;
    const completedFrame = vi.fn(async () => {});
    await waitForTextureUpload(
      { completedFrame },
      () => frames >= 3,
      async () => {
        frames++;
      },
    );
    expect(frames).toBe(3);
    expect(completedFrame).toHaveBeenCalledOnce();
  });

  it("GPUの完了待ち中に操作が始まった場合は転送を延期する", async () => {
    let available = true;
    let frames = 0;
    const completedFrame = vi.fn(async () => {
      if (frames === 1) available = false;
    });
    await waitForTextureUpload(
      { completedFrame },
      () => available,
      async () => {
        frames++;
        if (frames === 3) available = true;
      },
    );
    expect(frames).toBe(3);
    expect(completedFrame).toHaveBeenCalledTimes(2);
  });

  it("GPUの失敗を通知し、転送を開始しない", async () => {
    await expect(
      waitForTextureUpload(
        { completedFrame: () => Promise.reject(new Error("device lost")) },
        () => true,
        async () => {},
      ),
    ).rejects.toThrow("device lost");
  });
});
