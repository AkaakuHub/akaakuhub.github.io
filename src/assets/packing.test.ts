import { describe, expect, it } from "vite-plus/test";
import { createAssetPack, unpackAsset } from "./packing";

describe("アセットの梱包", () => {
  it("元のバイト列を変更せず、各画像を取り出す", () => {
    const sources = [
      { id: "paper", bytes: new Uint8Array([0, 1, 255]) },
      { id: "lighting", bytes: new Uint8Array([10, 11, 12, 13]) },
    ];
    const pack = createAssetPack(sources);
    pack.entries.forEach((entry, index) => {
      expect(unpackAsset(pack.bytes, entry)).toEqual(sources[index]?.bytes);
      expect(entry.offset % 8).toBe(0);
    });
    expect(new Uint16Array(pack.bytes.buffer, pack.entries[1]!.offset, 2).length).toBe(2);
  });
  it("取得したバッファーを共有し、画像ごとに複製しない", () => {
    const pack = new Uint8Array([0, 1, 2, 3]);
    expect(unpackAsset(pack, { offset: 1, bytes: 2 }).buffer).toBe(pack.buffer);
  });
  it("重複した識別子や空のアセットを拒否する", () => {
    const source = { id: "paper", bytes: new Uint8Array([1]) };
    expect(() => createAssetPack([source, source])).toThrow();
    expect(() => createAssetPack([{ id: "empty", bytes: new Uint8Array() }])).toThrow();
  });
  it("壊れた範囲を切り詰めずに拒否する", () => {
    for (const member of [
      { offset: -1, bytes: 1 },
      { offset: 0.5, bytes: 1 },
      { offset: 0, bytes: 0 },
      { offset: 0, bytes: 5 },
      { offset: 2, bytes: Number.POSITIVE_INFINITY },
    ])
      expect(() => unpackAsset(new Uint8Array(4), member)).toThrow();
  });
});
