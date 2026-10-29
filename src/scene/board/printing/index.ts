import type { BoardNotice } from "../notices";
import type { PrintedPaper, PrintRequest, PrintResponse } from "./protocol";

export function createPaperPrinter() {
  const worker = new Worker(new URL("./print.worker.ts", import.meta.url), { type: "module" });
  const pending = new Map<
    number,
    {
      resolve: (papers: PrintedPaper[]) => void;
      reject: (error: Error) => void;
    }
  >();
  let nextId = 0;
  let failure: Error | undefined;
  function dispose(cause: unknown): void {
    failure = cause instanceof Error ? cause : new Error(String(cause));
    worker.terminate();
    for (const request of pending.values()) request.reject(failure);
    pending.clear();
  }
  worker.onmessage = (event: MessageEvent<PrintResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (response.ok) request.resolve(response.papers);
    else request.reject(new Error(response.message));
  };
  worker.onerror = (event) => dispose(new Error(event.message));
  worker.onmessageerror = () => dispose(new Error("掲示の印刷結果を受け取れませんでした。"));
  return {
    dispose,
    print(
      notices: readonly BoardNotice[],
      stock: ImageBitmap,
      avatar: ImageBitmap,
    ): Promise<PrintedPaper[]> {
      if (failure) return Promise.reject(failure);
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const request: PrintRequest = { id, notices, stock, avatar };
        const thumbnails = new Set(
          notices.flatMap((notice) => (notice.thumbnail ? [notice.thumbnail] : [])),
        );
        try {
          worker.postMessage(request, { transfer: [...thumbnails] });
        } catch (cause) {
          pending.delete(id);
          reject(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });
    },
  };
}

export type PaperPrinter = ReturnType<typeof createPaperPrinter>;
