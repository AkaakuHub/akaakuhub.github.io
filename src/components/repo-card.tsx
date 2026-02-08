"use client";

import clsx from "clsx";
import Link from "next/link";
import { IconArrowRight, IconFork, IconStar } from "@/components/icons";
import { formatDateJa } from "@/lib/datetime";
import type { Repo } from "@/lib/github";

export default function RepoCard({
  repo,
  active,
  onSelect,
}: {
  repo: Repo;
  active: boolean;
  onSelect: () => void;
}) {
  const updated = formatDateJa(repo.updatedAt);

  return (
    <article
      className={clsx(
        "group relative w-[calc(100vw-3rem)] max-w-[320px] shrink-0 snap-center overflow-hidden cut-corners border border-border/80 bg-surface/65 p-4 paper-frame backdrop-blur transition sm:w-[290px]",
        active
          ? "border-primary/45 ring-1 ring-primary/30"
          : "hover:bg-surface/75 hover:border-border/90",
      )}
      onPointerEnter={onSelect}
    >
      <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-primary)_70%,transparent),transparent)] opacity-80" />

      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,color-mix(in_oklab,var(--color-secondary)_18%,transparent)_0,transparent_58%),radial-gradient(circle_at_82%_24%,color-mix(in_oklab,var(--color-primary)_18%,transparent)_0,transparent_60%)]" />
      </div>

      <header className="relative">
        {updated ? (
          <p className="text-[11px] text-muted">Updated {updated}</p>
        ) : null}
        <h3 className="font-display mt-1 line-clamp-1 text-2xl tracking-[0.08em]">
          {repo.name}
        </h3>
        {repo.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {repo.description}
          </p>
        ) : null}
      </header>

      <div className="relative mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <IconStar className="h-4 w-4" />
          {repo.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconFork className="h-4 w-4" />
          {repo.forks}
        </span>
        {repo.language ? (
          <span className="chip chip-xs cut-corners-xs">{repo.language}</span>
        ) : null}
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <Link
          href={`/projects/${encodeURIComponent(repo.name)}`}
          onFocus={onSelect}
          className="cut-corners inline-flex items-center gap-2 bg-fg px-3 py-2 text-xs font-semibold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          OPEN
          <IconArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted underline-offset-4 transition hover:text-fg hover:underline"
        >
          GitHub
        </a>
      </div>
    </article>
  );
}
