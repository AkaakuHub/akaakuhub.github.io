import Link from "next/link";
import { IconArrowRight, IconStar } from "@/components/icons";
import { formatDateJa } from "@/lib/datetime";
import type { Repo } from "@/lib/github";

export function RepoGrid({ repos }: { repos: Repo[] }) {
  return (
    <section data-section className="relative mt-10 pb-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-[0.22em]">
              ALL PROJECTS
            </h2>
            <p className="mt-2 text-sm text-muted">
              公開リポジトリを更新順に表示しています。
            </p>
          </div>
          <a
            href="https://github.com/AkaakuHub"
            target="_blank"
            rel="noreferrer"
            className="cut-corners border border-border/80 bg-surface/55 px-4 py-2 text-sm text-muted backdrop-blur transition hover:bg-surface/75 hover:text-fg"
          >
            View profile
          </a>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((r) => {
            const updated = formatDateJa(r.updatedAt);
            return (
              <Link
                key={r.id}
                href={`/projects/${encodeURIComponent(r.name)}`}
                className="group min-w-0 max-w-full cut-corners border border-border/80 bg-surface/60 p-5 paper-frame backdrop-blur transition hover:bg-surface/75"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-2xl tracking-[0.08em]">
                      {r.name}
                    </h3>
                    {r.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {r.description}
                      </p>
                    ) : null}
                  </div>
                  {updated ? (
                    <span className="chip chip-xs cut-corners-xs shrink-0">
                      {updated}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <IconStar className="h-4 w-4" />
                    {r.stars}
                  </span>
                  <span className="inline-flex items-center gap-2 font-display tracking-[0.22em] text-fg opacity-0 transition group-hover:opacity-100">
                    OPEN
                    <IconArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
