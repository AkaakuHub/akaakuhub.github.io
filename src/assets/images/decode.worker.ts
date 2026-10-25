import type { DecodeRequest, DecodeResponse } from "./protocol";

self.addEventListener("message", (event: MessageEvent<DecodeRequest>) => {
  const { id, blob, options } = event.data;
  void createImageBitmap(blob, options)
    .then((bitmap) => {
      const response: DecodeResponse = { id, ok: true, bitmap };
      self.postMessage(response, { transfer: [bitmap] });
    })
    .catch((error: unknown) => {
      const response: DecodeResponse = {
        id,
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    });
});
