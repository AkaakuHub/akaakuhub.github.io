import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { loadSiteContent, revokeSiteContent } from "../../content/client";
import { loadArticleThumbnails } from "../../content/thumbnails";
import { createBoardLoader } from "./loading";

vi.mock("../../content/client");
vi.mock("../../content/thumbnails");

afterEach(() => vi.resetAllMocks());

describe("掲示の非同期印刷", () => {
  it("描画の準備前に取得を始め、準備後に同じ画像を一度だけ渡す", async () => {
    const close = vi.fn();
    const bitmap: ImageBitmap = { width: 640, height: 336, close };
    vi.mocked(loadSiteContent).mockResolvedValue({ articles: [] });
    vi.mocked(loadArticleThumbnails).mockResolvedValue(new Map([["article", bitmap]]));
    const update = vi.fn(async () => {});
    const loader = createBoardLoader(update);
    loader.preload();
    loader.preload();
    await vi.waitFor(() => expect(loadArticleThumbnails).toHaveBeenCalledOnce());
    expect(update).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await loader.refresh(false);
    expect(loadSiteContent).toHaveBeenCalledOnce();
    expect(loadArticleThumbnails).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("先行取得の失敗後も通常の取得を実行する", async () => {
    vi.mocked(loadSiteContent)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ articles: [] });
    vi.mocked(loadArticleThumbnails).mockResolvedValue(new Map());
    const update = vi.fn(async () => {});
    const loader = createBoardLoader(update);
    loader.preload();
    await loader.refresh(false);
    expect(loadSiteContent).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith({
      status: "ready",
      content: { articles: [] },
      thumbnails: new Map(),
    });
  });

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
