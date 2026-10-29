import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { cachedLoad } = vi.hoisted(() => ({ cachedLoad: vi.fn() }));
vi.mock("unified-asset-loader/application/loadBinaryAsset", () => ({
  createBinaryAssetLoader: () => ({ load: cachedLoad }),
}));
vi.mock("unified-asset-loader/browser/browserArtifactLoader", () => ({
  loadBrowserArtifact: vi.fn(),
}));

const source = { id: "room/test.bin", url: "/test.bin", bytes: 3, sha256: "test" };
const bytes = new Uint8Array([1, 2, 3]);
const controller = new AbortController();

beforeEach(() => {
  vi.resetModules();
  cachedLoad.mockReset();
  vi.stubGlobal("location", { href: "https://example.com/" });
});
afterEach(() => vi.unstubAllGlobals());

function setup(getDirectory = vi.fn().mockResolvedValue({})) {
  const fetchBinary = vi.fn().mockImplementation(async () => new Response(bytes));
  vi.stubGlobal("navigator", { storage: { getDirectory } });
  vi.stubGlobal("fetch", fetchBinary);
  return { getDirectory, fetchBinary };
}

async function load() {
  const { loadAssetBinary } = await import("./binary");
  return loadAssetBinary(source, controller.signal, "high");
}

describe("アセットの保存先", () => {
  it("OPFSを利用できる場合は保存済みのデータを返す", async () => {
    const { fetchBinary } = setup();
    cachedLoad.mockResolvedValue({ value: bytes });
    expect(await load()).toEqual(bytes);
    expect(fetchBinary).not.toHaveBeenCalled();
  });

  it("OPFSが拒否された場合はHTTPで取得し、同じタブでは再確認しない", async () => {
    const { getDirectory, fetchBinary } = setup(
      vi.fn().mockRejectedValue(new DOMException("拒否", "SecurityError")),
    );
    expect(await Promise.all([load(), load()])).toEqual([bytes, bytes]);
    expect(getDirectory).toHaveBeenCalledTimes(1);
    expect(cachedLoad).not.toHaveBeenCalled();
    expect(fetchBinary).toHaveBeenCalledTimes(2);
  });

  it("OPFSのAPIがない場合もHTTPで取得する", async () => {
    setup();
    vi.stubGlobal("navigator", {});
    expect(await load()).toEqual(bytes);
    expect(cachedLoad).not.toHaveBeenCalled();
  });

  it("利用開始後に保存を拒否された場合はHTTPへ切り替える", async () => {
    const { fetchBinary } = setup();
    cachedLoad.mockRejectedValue(new DOMException("保存不可", "NotAllowedError"));
    expect(await load()).toEqual(bytes);
    expect(await load()).toEqual(bytes);
    expect(cachedLoad).toHaveBeenCalledTimes(1);
    expect(fetchBinary).toHaveBeenCalledTimes(2);
  });

  it("容量不足で保存できない場合はHTTPで取得する", async () => {
    setup();
    cachedLoad.mockRejectedValue(new Error("Browser artifact cache capacity is exhausted"));
    expect(await load()).toEqual(bytes);
  });

  it.each([
    new TypeError("通信失敗"),
    new Error("Binary asset byte length differs"),
    new DOMException("中断", "AbortError"),
  ])("通信失敗、破損、中断では別経路で再取得しない: %s", async (cause) => {
    const { fetchBinary } = setup();
    cachedLoad.mockRejectedValue(cause);
    await expect(load()).rejects.toBe(cause);
    expect(fetchBinary).not.toHaveBeenCalled();
  });

  it("中断済みの読み込みではOPFSにも通信にもアクセスしない", async () => {
    const { getDirectory, fetchBinary } = setup();
    const { loadAssetBinary } = await import("./binary");
    const cancelled = AbortSignal.abort();
    await expect(loadAssetBinary(source, cancelled, "low")).rejects.toBe(cancelled.reason);
    expect(getDirectory).not.toHaveBeenCalled();
    expect(cachedLoad).not.toHaveBeenCalled();
    expect(fetchBinary).not.toHaveBeenCalled();
  });
});
