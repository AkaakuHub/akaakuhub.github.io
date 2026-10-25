import type { Env } from "../env";

export async function serveContent(request: Request, env: Env) {
  const key = new Request(request.url);
  return env.CONTENT.get(env.CONTENT.idFromName("public")).fetch(key);
}
