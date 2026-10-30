import { describe, expect, it } from "vite-plus/test";
import { CloudField, cloudOpacity } from "./cloud-field";

const sun = { x: 0, y: 1, z: 0 };

describe("風で動く遠方の雲と遮光", () => {
  it("風速に比例した距離を移動し、風向で移動する向きを変える", () => {
    const slow = new CloudField(new Uint8Array(8192));
    const fast = new CloudField(new Uint8Array(8192));
    slow.update({ windSpeed: 5, windDirection: 0 }, 0.5);
    fast.update({ windSpeed: 10, windDirection: 90 }, 0.5);
    slow.advance(10);
    fast.advance(10);
    expect(slow.offset.x).toBeCloseTo(50);
    expect(slow.offset.y).toBeCloseTo(0);
    expect(fast.offset.x).toBeCloseTo(0);
    expect(fast.offset.y).toBeCloseTo(100);
  });

  it("風がないと移動せず、雲がないとアニメーションを要求しない", () => {
    const field = new CloudField(new Uint8Array(8192));
    field.update({ windSpeed: 0, windDirection: 0 }, 0.5);
    field.advance(1000);
    expect(field.offset.length()).toBe(0);
    expect(field.moving).toBe(false);
    field.update({ windSpeed: 10, windDirection: 0 }, 0);
    expect(field.moving).toBe(false);
    expect(field.transmission(sun)).toBe(1);
  });

  it("同じ風の経過時間なら更新頻度によらず同じ位置になる", () => {
    const slow = new CloudField(new Uint8Array(8192));
    const fast = new CloudField(new Uint8Array(8192));
    for (const field of [slow, fast]) field.update({ windSpeed: 17, windDirection: 220 }, 0.5);
    for (let index = 0; index < 100; index++) slow.advance(0.1);
    for (let index = 0; index < 600; index++) fast.advance(1 / 60);
    expect(slow.offset.distanceTo(fast.offset)).toBeLessThan(0.000001);
  });

  it("長時間動いても雲の位置を巻き戻して反復させない", () => {
    const field = new CloudField(new Uint8Array(8192).fill(180));
    field.update({ windSpeed: 10, windDirection: 0 }, 0.6);
    const before = field.transmission(sun);
    field.advance(1800);
    expect(field.offset.x).toBeCloseTo(18000);
    expect(field.transmission(sun)).toBeCloseTo(before);
  });

  it("太陽を覆う同じ雲が風で抜けると日光の透過率が上がる", () => {
    const data = new Uint8Array(8192);
    for (let index = 0; index < data.length; index++) data[index] = index < 128 * 16 ? 0 : 255;
    const field = new CloudField(data);
    field.update({ windSpeed: 10, windDirection: 0 }, 0.65);
    const direction = { x: 1, y: 1, z: 0 };
    const shaded = field.transmission(direction);
    field.advance(600);
    expect(field.transmission(direction)).toBeGreaterThan(shaded);
  });

  it("雲量がゼロなら雲を描かず、全天の雲では隙間を閉じる", () => {
    expect(cloudOpacity(1, 0)).toBe(0);
    expect(cloudOpacity(0, 1)).toBe(1);
    expect(cloudOpacity(0.7, 0.8)).toBeGreaterThan(cloudOpacity(0.7, 0.2));
  });
});
