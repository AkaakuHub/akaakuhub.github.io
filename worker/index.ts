import type { Env } from "./env";

export { TokyoWeatherCache } from "./weather/cache";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/weather") return env.ASSETS.fetch(request);
    if (request.method !== "GET")
      return new Response(null, { status: 405, headers: { Allow: "GET" } });
    if (url.search) return new Response(null, { status: 400 });
    const key = new Request(`${url.origin}/api/weather`);
    const cache = caches.default;
    const cached = await cache.match(key);
    if (cached) return cached;
    const id = env.WEATHER.idFromName("tokyo");
    const response = await env.WEATHER.get(id).fetch("https://weather/api/weather");
    if (response.ok) ctx.waitUntil(cache.put(key, response.clone()));
    return response;
  },
} satisfies ExportedHandler<Env>;
