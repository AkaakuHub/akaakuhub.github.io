import headingFontUrl from "../../../assets/fonts/yomogi/heading.woff2?url";
import fontUrl from "../../../assets/fonts/zen-maru-gothic/board.woff2?url";
import { printPaper } from "./paper";
import type { PrintRequest, PrintResponse } from "./protocol";

const fontReady = Promise.all([
  new FontFace("Zen Maru Gothic Board", `url(${fontUrl})`, { weight: "500" }).load(),
  new FontFace("Yomogi", `url(${headingFontUrl})`, { weight: "400" }).load(),
])
  .then((fonts) => {
    if (
      !("fonts" in self) ||
      typeof self.fonts !== "object" ||
      self.fonts === null ||
      !("add" in self.fonts) ||
      typeof self.fonts.add !== "function"
    )
      throw new Error("Workerで掲示のフォントを登録できませんでした。");
    for (const font of fonts) self.fonts.add(font);
  })
  .catch((cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause))));

self.addEventListener("message", (event: MessageEvent<PrintRequest>) => {
  const { id, notices, stock, avatar, language, team } = event.data;
  void (async () => {
    try {
      const failure = await fontReady;
      if (failure instanceof Error) throw failure;
      const papers = notices.map((notice) => printPaper(notice, stock, avatar, language, team));
      const response: PrintResponse = { id, ok: true, papers };
      self.postMessage(response, { transfer: papers.map((paper) => paper.pixels.buffer) });
    } catch (cause) {
      const response: PrintResponse = {
        id,
        ok: false,
        message: cause instanceof Error ? cause.message : String(cause),
      };
      self.postMessage(response);
    } finally {
      stock.close();
      avatar.close();
      language.close();
      team.close();
      for (const notice of notices) notice.thumbnail?.close();
    }
  })();
});
