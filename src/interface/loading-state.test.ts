import { describe, expect, it } from "vite-plus/test";
import { createLoadingState } from "./loading-state";

describe("初回ロードの状態", () => {
  it("素材と描画の準備が終わっても初回表示までは95％に留める", () => {
    const state = createLoadingState();
    state.advance("materials", 100, 100);
    state.advance("rendering", 4, 4);
    expect(state.value).toBeCloseTo(0.95);
    expect(state.status).toBe("loading");
    expect(state.complete()).toBe(true);
    expect(state.value).toBe(1);
  });

  it("遅れて届く進捗で数値を巻き戻さない", () => {
    const state = createLoadingState();
    state.advance("materials", 100, 100);
    state.advance("rendering", 4, 4);
    state.advance("materials", 0, 100);
    state.advance("rendering", 1, 4);
    expect(state.value).toBeCloseTo(0.95);
  });

  it("完了後のエラーと進捗更新で初回ロードを再開しない", () => {
    const state = createLoadingState();
    state.complete();
    expect(state.fail()).toBe(false);
    state.advance("materials", 0, 100);
    state.advance("rendering", 0, 4);
    expect(state.status).toBe("complete");
    expect(state.value).toBe(1);
    expect(state.complete()).toBe(false);
  });

  it("失敗しても取得済みの進捗を0％に戻さず、完了扱いにしない", () => {
    const state = createLoadingState();
    state.advance("materials", 100, 100);
    state.advance("rendering", 4, 4);
    expect(state.fail()).toBe(true);
    expect(state.fail()).toBe(false);
    expect(state.complete()).toBe(false);
    expect(state.status).toBe("failed");
    expect(state.value).toBeCloseTo(0.95);
  });

  it("両方の工程で範囲外の進捗を拒否する", () => {
    for (const stage of ["materials", "rendering"] as const) {
      for (const [completed, total] of [
        [-1, 4],
        [5, 4],
        [0, 0],
        [NaN, 4],
      ] as const)
        expect(() => createLoadingState().advance(stage, completed, total)).toThrow();
    }
  });
});
