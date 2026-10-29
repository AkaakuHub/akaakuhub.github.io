import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import { createBoardLoader } from "./loading";

vi.mock("../../content/client");
vi.mock("../../content/thumbnails");

afterEach(() => vi.resetAllMocks());

describe("掲示の非同期印刷", () => {
  it("Workerの印刷が完了するまで画像を解放しない", async () => {
    const close = vi.fn();
    const bitmap: ImageBitmap = { width: 640, height: 336, close };
    vi.mocked(loadSiteContent).mockResolvedValue({ articles: [] });
    vi.mocked(loadArticleThumbnails).mockResolvedValue(new Map([["article", bitmap]]));
    const printing = Promise.withResolvers<void>();
    const update = vi.fn(() => printing.promise);
    const loader = createBoardLoader(update);
    const completion = loader.refresh(false);
    await vi.waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(close).not.toHaveBeenCalled();
    printing.resolve();
    await completion;
    expect(close).toHaveBeenCalledOnce();
  });

  it("初回は表示済みの読み込み用紙を刷り直さない", async () => {
    vi.mocked(loadSiteContent).mockResolvedValue({ articles: [] });
    vi.mocked(loadArticleThumbnails).mockResolvedValue(new Map());
    const update = vi.fn(async () => {});
    await createBoardLoader(update).refresh(false);
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.calls[0]).toEqual([
      { status: "ready", content: { articles: [] }, thumbnails: new Map() },
    ]);
    expect(revokeSiteContent).not.toHaveBeenCalled();
  });
});
