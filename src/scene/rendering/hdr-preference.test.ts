import { describe, expect, it } from "vite-plus/test";
import { HdrPreference } from "./hdr-preference";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

describe("HDRの保存設定", () => {
  it("保存値がなければHDRを有効にする", () => {
    expect(new HdrPreference(storage()).enabled).toBe(true);
  });

  it("オフを保存し、次の起動でもオフから始める", () => {
    const saved = storage();
    const preference = new HdrPreference(saved);
    expect(preference.toggle()).toBe(false);
    expect(preference.enabled).toBe(false);
    expect(new HdrPreference(saved).enabled).toBe(false);
  });

  it("オンへ戻した選択も次の起動に引き継ぐ", () => {
    const saved = storage();
    const preference = new HdrPreference(saved);
    preference.toggle();
    expect(preference.toggle()).toBe(true);
    expect(new HdrPreference(saved).enabled).toBe(true);
  });

  it("保存に失敗した場合は選択状態を変えない", () => {
    const preference = new HdrPreference({
      getItem: () => null,
      setItem: () => {
        throw new Error("保存不可");
      },
    });
    expect(() => preference.toggle()).toThrow("保存不可");
    expect(preference.enabled).toBe(true);
  });
});
