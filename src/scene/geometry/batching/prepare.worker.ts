import { mergeBatches } from "./merge.ts";
import { geometryTransfers } from "./protocol.ts";
import type { BatchRequest, BatchResponse } from "./protocol.ts";

self.addEventListener("message", (event: MessageEvent<BatchRequest>) => {
  try {
    const geometries = mergeBatches(event.data);
    const response: BatchResponse = { ok: true, geometries };
    self.postMessage(response, { transfer: geometryTransfers(geometries) });
  } catch (error) {
    const response: BatchResponse = {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
