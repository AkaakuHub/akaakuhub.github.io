import Link from "next/link";
import { IconArrowRight, IconStar } from "@/components/icons";
import { formatDateJa } from "@/lib/datetime";
import type { Repo } from "@/lib/github";

export function HomeHero({
  active,
  query,
  onQueryChange,
  showingCount,
  totalCount,
}: {
  active: Repo | null;
  query: string;
  onQueryChange: (next: string) => void;
  showingCount: number;
  totalCount: number;
}) {
  const activeUpdated = active ? formatDateJa(active.updatedAt) : null;

  return (
    <section className="relative pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div data-reveal className="chip cut-corners-sm">
              {activeUpdated ? (
                <span className="chip-meta">Updated {activeUpdated}</span>
              ) : null}
            </div>

            <h1
              data-reveal
              className="mt-4 font-display text-6xl leading-[0.9] tracking-[0.06em] md:text-7xl text-chroma"
            >
              App Archive
            </h1>

            <p
              data-reveal
              className="mt-5 max-w-2xl text-pretty leading-relaxed text-chroma md:text-base"
            >
              GitHub上のパブリックリポジトリを一覧で表示しています。
            </p>

            <div data-reveal className="mt-7 grid gap-3 sm:max-w-lg">
              <label className="text-xs text-muted" htmlFor="repo-search">
                Search (name, description, topics, language)
              </label>
              <input
                id="repo-search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Type to filter..."
                className="cut-corners w-full border border-border/80 bg-surface/65 px-4 py-3 text-sm text-fg shadow-glow backdrop-blur outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="chip chip-xs cut-corners-xs">
                  Showing {showingCount}
                </span>
                <span className="chip chip-xs cut-corners-xs">
                  Total {totalCount}
                </span>
              </div>
            </div>

            {active ? (
              <div
                data-reveal
                className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted"
              >
                <span className="inline-flex items-center gap-1">
                  <IconStar className="h-4 w-4" />
                  {active.stars} stars
                </span>
                {active.language ? (
                  <span className="chip chip-xs cut-corners-xs">
                    {active.language}
                  </span>
                ) : null}
                {Array.isArray(active.topics)
                  ? active.topics.slice(0, 4).map((t) => (
                      <span key={t} className="chip chip-xs cut-corners-xs">
                        {t}
                      </span>
                    ))
                  : null}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            {active ? (
              <div
                data-reveal
                className="cut-corners relative overflow-hidden border border-border/80 bg-surface/55 paper-frame backdrop-blur"
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_42%,color-mix(in_oklab,var(--color-secondary)_16%,transparent))] opacity-75 [background-size:200%_200%] motion-safe:animate-[var(--animation-gradient-x)]" />
                <div className="relative p-4">
                  <p className="font-display text-xs tracking-[0.22em] text-muted">
                    SELECTED
                  </p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display truncate text-3xl tracking-[0.08em]">
                        {active.name}
                      </h2>
                      {active.description ? (
                        <p className="mt-2 text-sm text-muted">
                          {active.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/projects/${encodeURIComponent(active.name)}`}
                      className="cut-corners inline-flex items-center gap-2 bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      OPEN FILE
                      <IconArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={active.url}
                      target="_blank"
                      rel="noreferrer"
                      className="cut-corners inline-flex items-center gap-2 border border-border/80 bg-surface/60 px-5 py-3 text-sm text-fg backdrop-blur transition hover:bg-surface/80"
                    >
                      GitHub
                    </a>
                    {active.homepage ? (
                      <a
                        href={active.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="cut-corners inline-flex items-center gap-2 border border-border/80 bg-surface/60 px-5 py-3 text-sm text-fg backdrop-blur transition hover:bg-surface/80"
                      >
                        Demo
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div
                data-reveal
                className="cut-corners border border-border/80 bg-surface/55 p-6 paper-frame backdrop-blur"
              >
                <p className="font-display text-sm tracking-[0.22em] text-muted">
                  NO RESULTS
                </p>
                <p className="mt-3 text-sm text-muted">
                  今の検索条件では一致するリポジトリがありません。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
