import teamUrl from "../../../assets/icons/team411.png?url";
import languageUrl from "../../../assets/icons/typescript.png?url";
import type { BoardNotice } from "../notices";
import type { PrintedPaper, PrintRequest, PrintResponse } from "./protocol";

function createPrintWorker() {
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
      language: ImageBitmap,
      team: ImageBitmap,
    ): Promise<PrintedPaper[]> {
      if (failure) return Promise.reject(failure);
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const request: PrintRequest = { id, notices, stock, avatar, language, team };
        try {
          worker.postMessage(request);
        } catch (cause) {
          pending.delete(id);
          reject(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });
    },
  };
}

export function createPaperPrinter() {
  const workers = [createPrintWorker(), createPrintWorker()];
  const iconsReady = Promise.all(
    [languageUrl, teamUrl].map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("掲示のアイコンを読み込めませんでした。");
      return createImageBitmap(await response.blob());
    }),
  );
  return {
    dispose(cause: unknown): void {
      for (const worker of workers) worker.dispose(cause);
    },
    async print(
      notices: readonly BoardNotice[],
      stock: ImageBitmap,
      avatar: ImageBitmap,
    ): Promise<PrintedPaper[]> {
      const size = Math.ceil(notices.length / workers.length);
      if (size === 0) return [];
      const [language, team] = await iconsReady;
      if (!language || !team) throw new Error("掲示のアイコンが揃っていません。");
      const results = await Promise.all(
        workers.map((worker, index) => {
          const batch = notices.slice(index * size, (index + 1) * size);
          return batch.length === 0
            ? Promise.resolve([])
            : worker.print(batch, stock, avatar, language, team);
        }),
      );
      return results.flat();
    },
  };
}

export type PaperPrinter = ReturnType<typeof createPaperPrinter>;
