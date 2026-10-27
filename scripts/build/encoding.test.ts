import { describe, expect, it } from "vite-plus/test";
import { acceptsBrotli } from "./encoding";

describe("Brotliの転送方式の選択", () => {
  it("対応している場合だけ圧縮する", () => {
    expect(acceptsBrotli("gzip, deflate, br, zstd")).toBe(true);
    expect(acceptsBrotli("gzip")).toBe(false);
    expect(acceptsBrotli(undefined)).toBe(false);
  });
  it("クライアントの優先度を守る", () => {
    expect(acceptsBrotli("gzip;q=1, br;q=0.5")).toBe(false);
    expect(acceptsBrotli("gzip;q=0.5, br;q=1")).toBe(true);
    expect(acceptsBrotli("br;q=0.5, identity;q=1")).toBe(false);
  });
  it("明示的な拒否をワイルドカードで上書きしない", () => {
    expect(acceptsBrotli("*;q=1, br;q=0")).toBe(false);
    expect(acceptsBrotli("*;q=1")).toBe(true);
    expect(acceptsBrotli("*;q=0")).toBe(false);
  });
  it("大文字と空白を処理し、不正な優先度を除外する", () => {
    expect(acceptsBrotli(" GZIP ; q=0.5 , BR ; q=1 ")).toBe(true);
    expect(acceptsBrotli("br;q=invalid")).toBe(false);
    expect(acceptsBrotli("br;q=2")).toBe(false);
    expect(acceptsBrotli("br;q=-1")).toBe(false);
  });
});
