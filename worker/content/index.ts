import type { Env } from "../env";

export async function serveContent(request: Request, env: Env, ctx: ExecutionContext) {
  const key = new Request(new URL("/api/content", request.url));
  const cached = await caches.default.match(key);
  const response = cached ?? (await env.CONTENT.get(env.CONTENT.idFromName("public")).fetch(key));
  if (!cached && response.ok) ctx.waitUntil(caches.default.put(key, response.clone()));
  if (!response.ok) return response;
  const expires = response.headers.get("Expires");
  if (!expires) throw new Error("公開情報のキャッシュ期限がありません。");
  const remaining = Math.max(0, Math.floor((Date.parse(expires) - Date.now()) / 1000));
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", `public, max-age=${remaining}, s-maxage=${remaining}`);
  return result;
}
