import { nextTokyoDay, tokyoDay } from "../../src/weather/schema";

export interface WeatherBudget {
  day: number;
  nextAttemptAt: number;
}

export function reserveWeatherRequest(
  now: number,
  previous?: WeatherBudget,
): WeatherBudget | undefined {
  if (previous && (previous.day === tokyoDay(now) || now < previous.nextAttemptAt)) return;
  return { day: tokyoDay(now), nextAttemptAt: nextTokyoDay(now) };
}

export function retryAfter(now: number, budget: WeatherBudget): number {
  return Math.max(1, Math.ceil((budget.nextAttemptAt - now) / 1000));
}
