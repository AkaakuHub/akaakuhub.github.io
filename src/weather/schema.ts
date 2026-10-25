export const tokyo = { latitude: 35.6895, longitude: 139.69171, timezone: "Asia/Tokyo" } as const;
export const weatherRefreshMs = 10 * 60 * 1000;

export interface TokyoWeather {
  observedAt: number;
  fetchedAt: number;
  expiresAt: number;
  cloudCover: number;
  precipitation: number;
  directRadiation: number;
  diffuseRadiation: number;
}

export function weatherRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("天気データの形式が不正です。");
  return value as Record<string, unknown>;
}

export function weatherNumber(
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum)
    throw new Error(`天気データの${key}が不正です。`);
  return value;
}

export function parseWeather(value: unknown): TokyoWeather {
  const record = weatherRecord(value);
  const weather = {
    observedAt: weatherNumber(record, "observedAt", 0, Number.MAX_SAFE_INTEGER),
    fetchedAt: weatherNumber(record, "fetchedAt", 0, Number.MAX_SAFE_INTEGER),
    expiresAt: weatherNumber(record, "expiresAt", 0, Number.MAX_SAFE_INTEGER),
    cloudCover: weatherNumber(record, "cloudCover", 0, 100),
    precipitation: weatherNumber(record, "precipitation", 0, 1000),
    directRadiation: weatherNumber(record, "directRadiation", 0, 2000),
    diffuseRadiation: weatherNumber(record, "diffuseRadiation", 0, 2000),
  };
  if (
    weather.expiresAt <= weather.fetchedAt ||
    weather.expiresAt - weather.fetchedAt > weatherRefreshMs
  )
    throw new Error("天気データの有効期限が不正です。");
  return weather;
}
