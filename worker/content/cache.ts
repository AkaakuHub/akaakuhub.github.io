import { fetchArticles, fetchRepositories } from "./source";
import { parseSiteContent } from "../../src/content/schema";
import type { SiteContent } from "../../src/content/schema";

interface Cached<Value> {
  value: Value;
  expiresAt: number;
}

export class SiteContentCache implements DurableObject {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const results = await Promise.allSettled([
        this.resource("repositories", 86_400_000, fetchRepositories),
        this.resource("articles", 3_600_000, fetchArticles),
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
      const expiresAt = Math.min(repositories.value.expiresAt, articles.value.expiresAt);
      const content: SiteContent = parseSiteContent({
        repositories: repositories.value.value,
        articles: articles.value.value,
      });
      return Response.json(content, {
        headers: {
          "Cache-Control": `public, max-age=${Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))}`,
          Expires: new Date(expiresAt).toUTCString(),
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
      throw new Error(`${key === "articles" ? "RSS" : "GitHub"}は取得上限のため更新できません。`);
    const expiresAt = now + ttl;
    await this.ctx.storage.put(`${key}:nextAttempt`, expiresAt);
    const entry = { value: await load(), expiresAt };
    await this.ctx.storage.put(key, entry);
    return entry;
  }
}
