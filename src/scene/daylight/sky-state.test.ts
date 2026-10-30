import { describe, expect, it } from "vite-plus/test";
import type { TokyoWeather } from "../../weather/schema";
import { skyAppearance } from "./sky-state";
import { roomCelestialLighting } from "./celestial";

const clear: TokyoWeather = {
  observedAt: 0,
  fetchedAt: 0,
  expiresAt: 1,
  cloudCover: 0,
  precipitation: 0,
  directRadiation: 700,
  diffuseRadiation: 100,
  weatherCode: 0,
  rain: 0,
  snowfall: 0,
  windSpeed: 0,
  windDirection: 0,
};

describe("窓の空と天気", () => {
  it("雲量が増えると青空から部分的な雲、全面の雲へ連続して変わる", () => {
    const sunny = skyAppearance(40, clear);
    const partly = skyAppearance(40, { ...clear, cloudCover: 25 });
    const cloudy = skyAppearance(40, { ...clear, cloudCover: 100 });
    expect(sunny.cloud).toBe(0);
    expect(partly.cloud).toBe(0.25);
    expect(cloudy.cloud).toBe(1);
    expect(sunny.daylight).toBe(1);
  });

  it("降水中は雨雲を表示し、強い雨ほど暗くする", () => {
    const light = skyAppearance(40, { ...clear, rain: 0.5 });
    const heavy = skyAppearance(40, { ...clear, rain: 10 });
    expect(light.cloud).toBeGreaterThanOrEqual(0.9);
    expect(heavy.brightness).toBeLessThan(light.brightness);
    expect(heavy.stars).toBe(0);
  });

  it("雪の空は厚い雲で覆い、雨による暗さを加えない", () => {
    const snow = skyAppearance(20, { ...clear, snowfall: 2 });
    const rain = skyAppearance(20, { ...clear, rain: 8 });
    expect(snow.cloud).toBeGreaterThanOrEqual(0.9);
    expect(snow.brightness).toBeGreaterThan(rain.brightness);
  });

  it("太陽高度に従い朝夕の空から昼と夜へ変え、曇天では星を隠す", () => {
    const twilight = skyAppearance(-2, clear);
    const night = skyAppearance(-20, clear);
    const overcastNight = skyAppearance(-20, { ...clear, cloudCover: 100 });
    expect(twilight.twilight).toBe(1);
    expect(skyAppearance(40, clear).twilight).toBe(0);
    expect(night.daylight).toBe(0);
    expect(night.stars).toBe(1);
    expect(overcastNight.stars).toBe(0);
  });

  it("東京の朝と夕方では日が明るい方角が東西で入れ替わる", () => {
    const morning = roomCelestialLighting(new Date("2026-10-30T07:00:00+09:00"), clear);
    const evening = roomCelestialLighting(new Date("2026-10-30T16:00:00+09:00"), clear);
    const night = roomCelestialLighting(new Date("2026-10-30T23:00:00+09:00"), clear);
    expect(morning.sunDirection.z * evening.sunDirection.z).toBeLessThan(0);
    expect(morning.sunAltitude).toBeGreaterThan(0);
    expect(evening.sunAltitude).toBeGreaterThan(0);
    expect(skyAppearance(night.sunAltitude, clear).daylight).toBe(0);
  });
});
