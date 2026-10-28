import { Texture } from "three";
import { describe, expect, it } from "vite-plus/test";
import { DisplayState } from "./display-state";

function fixture() {
  const state = new DisplayState();
  const frame = {
    source: new Texture(),
    revision: 1,
    exposure: 6.5,
    headroom: 4,
  };
  expect(state.update(frame, false)).toBe(true);
  return { state, frame };
}

describe("表示用の色変換の再計算", () => {
  it("画角と照明が同じならフェード中も変換結果を再利用する", () => {
    const { state, frame } = fixture();
    for (let index = 0; index < 100; index++) expect(state.update(frame, false)).toBe(false);
  });

  it("同じテクスチャへ部屋を描き直したときに更新する", () => {
    const { state, frame } = fixture();
    const changed = { ...frame, revision: 2 };
    expect(state.update(changed, false)).toBe(true);
    expect(state.update(changed, false)).toBe(false);
  });

  it("静的キャッシュと動的な合成先の切り替えを反映する", () => {
    const { state, frame } = fixture();
    expect(state.update({ ...frame, source: new Texture() }, false)).toBe(true);
    expect(state.update(frame, false)).toBe(true);
  });

  it("動的物体・天気の変化を反映する", () => {
    const { state, frame } = fixture();
    expect(state.update(frame, true)).toBe(true);
    expect(state.update(frame, true)).toBe(true);
    expect(state.update(frame, false)).toBe(false);
  });

  it("露出とHDR表示範囲の変更を反映する", () => {
    const { state, frame } = fixture();
    const exposure = { ...frame, exposure: 7 };
    expect(state.update(exposure, false)).toBe(true);
    expect(state.update({ ...exposure, headroom: 1 }, false)).toBe(true);
  });
});
