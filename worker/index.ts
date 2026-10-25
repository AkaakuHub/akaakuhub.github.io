import type { Env } from "./env";
import { nextTokyoDay, tokyoDay } from "../src/weather/schema";

export { TokyoWeatherCache } from "./weather/cache";

function browserResponse(response: Response, now: number): Response {
  const result = new Response(response.body, response);
  const ttl = Math.max(0, Math.floor((nextTokyoDay(now) - now) / 1000));
  result.headers.set("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}`);
  result.headers.set("Expires", new Date(nextTokyoDay(now)).toUTCString());
  result.headers.set("Date", new Date(now).toUTCString());
  result.headers.set("Age", "0");
  if (result.status === 503) result.headers.set("Retry-After", String(ttl + 1));
  return result;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/weather") return env.ASSETS.fetch(request);
    if (request.method !== "GET")
      return new Response(null, { status: 405, headers: { Allow: "GET" } });
    if (url.search) return new Response(null, { status: 400 });
    const now = Date.now();
    const key = new Request(`${url.origin}/api/weather/${tokyoDay(now)}`);
    const cache = caches.default;
    const cached = await cache.match(key);
    if (cached) return browserResponse(cached, now);
    const id = env.WEATHER.idFromName("tokyo");
    const response = await env.WEATHER.get(id).fetch("https://weather/api/weather");
    if (response.ok || response.status === 503) ctx.waitUntil(cache.put(key, response.clone()));
    return browserResponse(response, Date.now());
  },
} satisfies ExportedHandler<Env>;
