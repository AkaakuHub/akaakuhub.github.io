import { describe, expect, it } from "vite-plus/test";
import { NoticeTour } from "./notice-tour";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe("初回来訪時の紙の案内", () => {
  it("初回は表示開始後も末尾へ着くまで制限し、案内を出さない", () => {
    const tour = new NoticeTour(storage(), 3);
    tour.start();
    for (const index of [0, 1, 2]) {
      expect(tour.arrive(index)).toBe(false);
      expect(tour.restricted).toBe(true);
      expect(tour.showGuide).toBe(false);
    }
  });

  it("末尾への到着で解禁し、案内を表示する", () => {
    const tour = new NoticeTour(storage(), 3);
    tour.start();
    expect(tour.arrive(3)).toBe(true);
    expect(tour.restricted).toBe(false);
    expect(tour.showGuide).toBe(true);
    expect(tour.arrive(3)).toBe(false);
  });

  it("紙の外へ出たら、その訪問中は案内を再表示しない", () => {
    const tour = new NoticeTour(storage(), 3);
    tour.start();
    tour.arrive(3);
    tour.leave();
    tour.arrive(3);
    expect(tour.showGuide).toBe(false);
  });

  it("2回目は初回を途中で閉じていても制限と案内がない", () => {
    const saved = storage();
    new NoticeTour(saved, 3).start();
    const returning = new NoticeTour(saved, 3);
    returning.start();
    returning.arrive(3);
    expect(returning.restricted).toBe(false);
    expect(returning.showGuide).toBe(false);
  });

  it("表示を開始できなかった場合は来訪済みにしない", () => {
    const saved = storage();
    new NoticeTour(saved, 3);
    expect(new NoticeTour(saved, 3).restricted).toBe(true);
  });
});
