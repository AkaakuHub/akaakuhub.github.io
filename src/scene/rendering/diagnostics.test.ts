import { describe, expect, it } from "vite-plus/test";
import { RenderingDiagnostics } from "./diagnostics";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("描画エラーの記録", () => {
  it("シェーダー全文を除き、失敗状態と呼び出し元を残す", () => {
    const log = new RenderingDiagnostics(storage());
    log.record(
      new Error(
        "GL error: 0x505\nVertex compiled: false\nVertex source:\n#version 300 es\nvoid main() {}\nFragment source:\nvoid main() {}",
      ),
      "WebGL shader",
    );
    expect(log.report()).toContain("GL error: 0x505");
    expect(log.report()).toContain("Vertex compiled: false");
    expect(log.report()).not.toContain("void main");
    expect(log.report()).not.toContain("#version");
  });

  it("同じ例外が複数の処理へ伝わっても重複記録しない", () => {
    const log = new RenderingDiagnostics(storage());
    const error = new Error("最初の障害");
    log.record(error, "WebGL shader");
    log.record(error, "Render recovery");
    log.record(error, "Application recovery failed");
    expect(log.report().match(/最初の障害/g)).toHaveLength(1);
    expect(log.report()).toContain("WebGL shader");
  });
  it("後続の障害が発生しても最初の障害を先頭に保つ", () => {
    const log = new RenderingDiagnostics(storage());
    log.record(new Error("最初の障害"), "WebGPU");
    log.record(new Error("後続の障害"), "WebGL");
    expect(log.report().indexOf("最初の障害")).toBeLessThan(log.report().indexOf("後続の障害"));
  });

  it("自動再起動をまたいでログを引き継ぐ", () => {
    const saved = storage();
    new RenderingDiagnostics(saved).record(new Error("再起動前"), "WebGPU");
    const next = new RenderingDiagnostics(saved);
    next.record(new Error("再起動後"), "WebGL");
    expect(next.report()).toContain("再起動前");
    expect(next.report()).toContain("再起動後");
  });

  it("大量のエラーでも先頭と直近を残し、記録数を制限する", () => {
    const log = new RenderingDiagnostics(storage());
    for (let i = 0; i < 30; i++) log.record(`障害-${i}`, "WebGL");
    expect(log.report()).toContain("障害-0");
    expect(log.report()).toContain("障害-29");
    expect(log.report()).not.toContain("障害-1\n");
    expect(log.report().match(/\[\d+\]/g)).toHaveLength(6);
  });

  it("保存先の容量が不足しても元のエラーを別の例外で隠さない", () => {
    const log = new RenderingDiagnostics({
      getItem: () => null,
      setItem: () => {
        throw new DOMException("容量不足", "QuotaExceededError");
      },
    });
    expect(() => log.record(new Error("描画失敗"), "WebGL")).not.toThrow();
    expect(log.report()).toContain("描画失敗");
  });
});
