import { scheduleBrowserArtifactPreparation } from "unified-asset-loader/browser/browserArtifactPreparationScheduler";
import type { DecodeRequest, DecodeResponse } from "./protocol";

export function createImageDecoder() {
  const worker = new Worker(new URL("./decode.worker.ts", import.meta.url), { type: "module" });
  const pending = new Map<
    number,
    { resolve: (bitmap: ImageBitmap) => void; reject: (error: Error) => void }
  >();
  let nextId = 0;
  let failure: Error | undefined;

  function dispose(error: Error): void {
    failure = error;
    worker.terminate();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  }
  worker.onmessage = (event: MessageEvent<DecodeResponse>) => {
    const result = event.data;
    const request = pending.get(result.id);
    if (!request) {
      if (result.ok) result.bitmap.close();
      return;
    }
    pending.delete(result.id);
    if (result.ok) request.resolve(result.bitmap);
    else request.reject(new Error(result.message));
  };
  worker.onerror = (event) => dispose(new Error(event.message));
  worker.onmessageerror = () =>
    dispose(new Error("復号した画像をWorkerから受け取れませんでした。"));
  return {
    dispose,
    decode(bytes: Uint8Array, options: ImageBitmapOptions): Promise<ImageBitmap> {
      return scheduleBrowserArtifactPreparation(4 * 1024 * 1024, async () => {
        if (failure) throw failure;
        if (!(bytes.buffer instanceof ArrayBuffer))
          throw new Error("画像のバイト列が転送可能なバッファーではありません。");
        const blob = new Blob([new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)], {
          type: "image/webp",
        });
        const id = nextId++;
        return await new Promise<ImageBitmap>((resolve, reject) => {
          pending.set(id, { resolve, reject });
          const request: DecodeRequest = { id, blob, options };
          worker.postMessage(request);
        });
      });
    },
  };
}
