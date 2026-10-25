export const tokyo = {
  latitude: 35.683659,
  longitude: 139.754089,
  timezone: "Asia/Tokyo",
} as const;
const dayMs = 24 * 60 * 60 * 1000;
const japanOffsetMs = 9 * 60 * 60 * 1000;
const weatherCodes = new Set([
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 97, 99,
]);

export function tokyoDay(now: number): number {
  return Math.floor((now + japanOffsetMs) / dayMs);
}

export function nextTokyoDay(now: number): number {
  return (tokyoDay(now) + 1) * dayMs - japanOffsetMs;
}

interface WeatherHour {
  time: number;
  cloudCover: number;
  precipitation: number;
  directRadiation: number;
  diffuseRadiation: number;
  weatherCode: number;
  rain: number;
  snowfall: number;
  windSpeed: number;
  windDirection: number;
}

export interface WeatherDay {
  fetchedAt: number;
  expiresAt: number;
  hours: readonly WeatherHour[];
}

export interface TokyoWeather {
  observedAt: number;
  fetchedAt: number;
  expiresAt: number;
  cloudCover: number;
  precipitation: number;
  directRadiation: number;
  diffuseRadiation: number;
  weatherCode: number;
  rain: number;
  snowfall: number;
  windSpeed: number;
  windDirection: number;
}

export function weatherRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("天気データの形式が不正です。");
  return value as Record<string, unknown>;
}

function weatherNumber(
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

export function parseWeatherDay(value: unknown): WeatherDay {
  const record = weatherRecord(value);
  const fetchedAt = weatherNumber(record, "fetchedAt", 0, Number.MAX_SAFE_INTEGER);
  const expiresAt = weatherNumber(record, "expiresAt", 0, Number.MAX_SAFE_INTEGER);
  if (expiresAt !== nextTokyoDay(fetchedAt)) throw new Error("天気データの日付が不正です。");
  if (!Array.isArray(record.hours) || record.hours.length !== 25)
    throw new Error("1日分の時間別予報が必要です。");
  const hours = record.hours.map((value: unknown, index: number): WeatherHour => {
    const hour = weatherRecord(value);
    const time = weatherNumber(hour, "time", 0, Number.MAX_SAFE_INTEGER);
    if (time !== expiresAt - dayMs + index * 3_600_000)
      throw new Error("時間別予報の時刻が不正です。");
    const weatherCode = weatherNumber(hour, "weatherCode", 0, 99);
    if (!weatherCodes.has(weatherCode)) throw new Error("天気コードが不正です。");
    return {
      time,
      cloudCover: weatherNumber(hour, "cloudCover", 0, 100),
      precipitation: weatherNumber(hour, "precipitation", 0, 1000),
      directRadiation: weatherNumber(hour, "directRadiation", 0, 2000),
      diffuseRadiation: weatherNumber(hour, "diffuseRadiation", 0, 2000),
      weatherCode,
      rain: weatherNumber(hour, "rain", 0, 1000),
      snowfall: weatherNumber(hour, "snowfall", 0, 1000),
      windSpeed: weatherNumber(hour, "windSpeed", 0, 150),
      windDirection: weatherNumber(hour, "windDirection", 0, 360),
    };
  });
  return { fetchedAt, expiresAt, hours };
}

export function weatherAt(day: WeatherDay, now: number): TokyoWeather {
  if (tokyoDay(now) !== tokyoDay(day.fetchedAt)) throw new Error("本日の天気予報が必要です。");
  const start = day.expiresAt - dayMs;
  const elapsed = (now - start) / 3_600_000;
  const index = Math.floor(elapsed);
  const first = day.hours[index];
  const second = day.hours[index + 1];
  if (!first || !second) throw new Error("現在時刻の予報がありません。");
  const fraction = elapsed - index;
  const interpolate = (a: number, b: number) => a + (b - a) * fraction;
  const wind = (hour: WeatherHour, axis: "x" | "z") => {
    const angle = (hour.windDirection * Math.PI) / 180;
    return hour.windSpeed * (axis === "x" ? Math.cos(angle) : Math.sin(angle));
  };
  const windX = interpolate(wind(first, "x"), wind(second, "x"));
  const windZ = interpolate(wind(first, "z"), wind(second, "z"));
  return {
    observedAt: first.time,
    fetchedAt: day.fetchedAt,
    expiresAt: day.expiresAt,
    cloudCover: interpolate(first.cloudCover, second.cloudCover),
    precipitation: second.precipitation,
    directRadiation: interpolate(first.directRadiation, second.directRadiation),
    diffuseRadiation: interpolate(first.diffuseRadiation, second.diffuseRadiation),
    weatherCode: first.weatherCode,
    rain: second.rain,
    snowfall: second.snowfall,
    windSpeed: Math.hypot(windX, windZ),
    windDirection: ((Math.atan2(windZ, windX) * 180) / Math.PI + 360) % 360,
  };
}
