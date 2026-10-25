import type { TokyoWeather } from "../../src/weather/schema";
import { reserveWeatherRequest, retryAfter } from "./budget";
import type { WeatherBudget } from "./budget";
import { fetchTokyoWeather } from "./source";

export class TokyoWeatherCache implements DurableObject {
  private weather: TokyoWeather | undefined;
  private budget: WeatherBudget | undefined;

  constructor(private readonly ctx: DurableObjectState) {
    ctx.blockConcurrencyWhile(async () => {
      [this.weather, this.budget] = await Promise.all([
        ctx.storage.get<TokyoWeather>("weather"),
        ctx.storage.get<WeatherBudget>("budget"),
      ]);
    });
  }

  async fetch(): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = Date.now();
      if (this.weather && now < this.weather.expiresAt) return this.response(this.weather, now);
      const reserved = reserveWeatherRequest(now, this.budget);
      if (!reserved) {
        if (!this.budget) throw new Error("天気APIの回数制限が不正です。");
        return this.unavailable(retryAfter(now, this.budget));
      }
      this.budget = reserved;
      await this.ctx.storage.put("budget", reserved);
      try {
        const weather = await fetchTokyoWeather();
        await this.ctx.storage.put("weather", weather);
        this.weather = weather;
        return this.response(weather, Date.now());
      } catch (error) {
        console.error(error instanceof Error ? error.message : "天気情報を取得できませんでした。");
        return this.unavailable(retryAfter(Date.now(), reserved));
      }
    });
  }

  private response(weather: TokyoWeather, now: number): Response {
    const ttl = Math.max(1, Math.floor((weather.expiresAt - now) / 1000));
    return Response.json(weather, {
      headers: { "Cache-Control": `public, max-age=${Math.min(60, ttl)}, s-maxage=${ttl}` },
    });
  }

  private unavailable(seconds: number): Response {
    return Response.json(
      { error: "東京の天気情報を取得できません。時間を置いて再読み込みしてください。" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": String(seconds) },
      },
    );
  }
}
