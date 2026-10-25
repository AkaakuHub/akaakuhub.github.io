import { fetchArticles, fetchRepositories, readArticles, readRepositories } from "./source";
import { parseSiteContent } from "../../src/content/schema";
import type { SiteContent } from "../../src/content/schema";
import { fetchReadme } from "./readme";

interface Cached<Value> {
  value: Value;
  expiresAt: number;
}

export class SiteContentCache implements DurableObject {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/api/readme/")) {
        const name = decodeURIComponent(path.slice("/api/readme/".length));
        if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(name)) return new Response(null, { status: 400 });
        const cached = await this.ctx.storage.get<Cached<string>>("repositories:raw");
        if (
          !cached ||
          Date.now() >= cached.expiresAt ||
          !readRepositories(cached.value).some((repository) => repository.name === name)
        )
          return new Response(null, { status: 404 });
        try {
          const entry = await this.resource(`readme:${name}`, 86_400_000, () => fetchReadme(name));
          return Response.json(
            { text: entry.value },
            {
              headers: {
                "Cache-Control": `public, max-age=${Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000))}`,
              },
            },
          );
        } catch (error) {
          console.error(error);
          return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
        }
      }
      const results = await Promise.allSettled([
        this.resource("repositories:raw", 86_400_000, fetchRepositories),
        this.resource("articles:raw", 86_400_000, fetchArticles),
      ]);
      const [repositories, articles] = results;
      const failures = results.filter((result) => result.status === "rejected");
      if (repositories.status === "rejected" || articles.status === "rejected") {
        const messages = failures.map((result) =>
          result.reason instanceof Error ? result.reason.message : "公開情報を取得できません。",
        );
        return Response.json(
          { error: messages.join("\n") },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
      const content: SiteContent = parseSiteContent({
        repositories: readRepositories(repositories.value.value),
        articles: readArticles(articles.value.value),
      });
      return Response.json(content, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    });
  }

  private async resource<Value>(
    key: string,
    ttl: number,
    load: () => Promise<Value>,
  ): Promise<Cached<Value>> {
    const now = Date.now();
    const [cached, nextAttempt] = await Promise.all([
      this.ctx.storage.get<Cached<Value>>(key),
      this.ctx.storage.get<number>(`${key}:nextAttempt`),
    ]);
    if (cached && now < cached.expiresAt) return cached;
    if (nextAttempt && now < nextAttempt)
      throw new Error(
        `${key.startsWith("articles:") ? "RSS" : "GitHub"}は取得上限のため更新できません。`,
      );
    const expiresAt = now + ttl;
    await this.ctx.storage.put(`${key}:nextAttempt`, expiresAt);
    const entry = { value: await load(), expiresAt };
    await this.ctx.storage.put(key, entry);
    return entry;
  }
}
