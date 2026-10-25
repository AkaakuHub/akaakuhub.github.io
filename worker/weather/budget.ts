import { weatherRefreshMs } from "../../src/weather/schema";

const dayMs = 24 * 60 * 60 * 1000;
const maximumDailyRequests = 144;

export interface WeatherBudget {
  day: number;
  attempts: number;
  nextAttemptAt: number;
}

export function reserveWeatherRequest(
  now: number,
  previous?: WeatherBudget,
): WeatherBudget | undefined {
  const day = Math.floor(now / dayMs);
  const attempts = previous?.day === day ? previous.attempts : 0;
  if ((previous && now < previous.nextAttemptAt) || attempts >= maximumDailyRequests) return;
  return { day, attempts: attempts + 1, nextAttemptAt: now + weatherRefreshMs };
}

export function retryAfter(now: number, budget: WeatherBudget): number {
  const allowedAt =
    budget.attempts >= maximumDailyRequests
      ? Math.max(budget.nextAttemptAt, (budget.day + 1) * dayMs)
      : budget.nextAttemptAt;
  return Math.max(1, Math.ceil((allowedAt - now) / 1000));
}
