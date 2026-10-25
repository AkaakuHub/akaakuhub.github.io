import { fetchArticles, readArticles } from "./source";

interface CachedArticles {
  value: string;
  expiresAt: number;
}

export class SiteContentCache implements DurableObject {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      try {
        const now = Date.now();
        const [cached, nextAttempt] = await Promise.all([
          this.ctx.storage.get<CachedArticles>("articles:raw"),
          this.ctx.storage.get<number>("articles:raw:nextAttempt"),
        ]);
        if (cached && now < cached.expiresAt)
          return Response.json(
            { articles: readArticles(cached.value) },
            { headers: { "Cache-Control": "no-store" } },
          );
        if (nextAttempt && now < nextAttempt)
          throw new Error("RSSは取得上限のため更新できません。");
        const expiresAt = now + 86_400_000;
        await this.ctx.storage.put("articles:raw:nextAttempt", expiresAt);
        const entry = { value: await fetchArticles(), expiresAt };
        await this.ctx.storage.put("articles:raw", entry);
        return Response.json(
          { articles: readArticles(entry.value) },
          { headers: { "Cache-Control": "no-store" } },
        );
      } catch (error) {
        console.error(error);
        return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
    });
  }
}
