import { describe, expect, it } from "vite-plus/test";
import { paperLinkAt } from "./paper-links";

const link = {
  label: "team411",
  href: "https://team411.net/",
  x: 0.1,
  y: 0.4,
  width: 0.2,
  height: 0.1,
};

describe("紙に印刷したリンクのクリック判定", () => {
  it("UVの上下を印刷位置へ変換して文字とアイコンの範囲を選ぶ", () => {
    expect(paperLinkAt([link], { x: 0.2, y: 0.55 })).toBe(link);
  });
  it.each([
    { x: 0.09, y: 0.55 },
    { x: 0.31, y: 0.55 },
    { x: 0.2, y: 0.49 },
    { x: 0.2, y: 0.61 },
  ])("文字とアイコンの外側ではリンクを選ばない: %s", (uv) => {
    expect(paperLinkAt([link], uv)).toBeUndefined();
  });
  it("紙にリンクがない場合やUVがない場合は選ばない", () => {
    expect(paperLinkAt([], { x: 0.2, y: 0.55 })).toBeUndefined();
    expect(paperLinkAt([link], undefined)).toBeUndefined();
  });
});
