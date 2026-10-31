import { Texture } from "three";
import { describe, expect, it, vi } from "vite-plus/test";
import { replaceTextureImage } from "./texture-image";

describe("画像の解像度変更", () => {
  it("元のGPU領域を解放してから画像を置き換え、再転送を要求する", () => {
    const previous: ImageBitmap = { width: 128, height: 128, close: vi.fn() };
    const next: ImageBitmap = { width: 1024, height: 1024, close: vi.fn() };
    const texture = new Texture<ImageBitmap | null>(previous);
    const version = texture.version;
    const disposed = vi.fn(() => expect(texture.image).toBe(previous));
    texture.addEventListener("dispose", disposed);
    replaceTextureImage(texture, next);
    expect(disposed).toHaveBeenCalledOnce();
    expect(texture.image).toBe(next);
    expect(texture.version).toBeGreaterThan(version);
    expect(previous.close).toHaveBeenCalledOnce();
    expect(next.close).not.toHaveBeenCalled();
  });
});
