"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import BackdropStage from "@/components/backdrop-stage";
import { IconArrowRight, IconFork, IconStar } from "@/components/icons";
import Markdown from "@/components/markdown";
import { formatDateTimeJa } from "@/lib/datetime";
import type { Repo } from "@/lib/github";
import { prefersReducedMotion } from "@/lib/reduced-motion";

export default function ProjectClient({
  repo,
  readme,
}: {
  repo: Repo;
  readme: string | null;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const updated = formatDateTimeJa(repo.updatedAt);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-pop]",
        { y: 18, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="grain relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <BackdropStage imageUrl={repo.ogImageUrl} />
      </div>

      <section className="pt-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end p-4">
          <div className="lg:col-span-7">
            <p data-pop className="chip cut-corners-sm">
              <span className="chip-title">PROJECT FILE</span>
              {updated ? (
                <span className="chip-meta">Updated {updated}</span>
              ) : null}
            </p>

            <h1
              data-pop
              className="mt-4 font-display text-6xl leading-[0.9] tracking-[0.06em] md:text-7xl text-chroma"
            >
              {repo.name}
            </h1>

            {repo.description ? (
              <p
                data-pop
                className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted md:text-base"
              >
                {repo.description}
              </p>
            ) : null}

            <div data-pop className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="cut-corners inline-flex items-center gap-2 bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                GitHub
                <IconArrowRight className="h-4 w-4" />
              </a>
              {repo.homepage ? (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="cut-corners inline-flex items-center gap-2 border border-border/80 bg-surface/60 px-5 py-3 text-sm text-fg backdrop-blur transition hover:bg-surface/80"
                >
                  Demo
                </a>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div
              data-pop
              className="cut-corners relative overflow-hidden border border-border/80 bg-surface/55 paper-frame backdrop-blur"
            >
              <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_42%,color-mix(in_oklab,var(--color-secondary)_16%,transparent))] opacity-75 [background-size:200%_200%] motion-safe:animate-[var(--animation-gradient-x)]" />
              <div className="relative p-4">
                <div
                  role="img"
                  aria-label={`${repo.name} social preview`}
                  className="aspect-[16/10] w-full cut-corners border border-border/80 bg-cover bg-center"
                  style={{ backgroundImage: `url("${repo.ogImageUrl}")` }}
                />
                <p className="mt-3 text-[11px] text-muted">
                  GitHub OpenGraph preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-pop className="mt-8">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="cut-corners grid gap-3 border border-border/80 bg-surface/60 p-5 paper-frame backdrop-blur">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1 text-fg">
                  <IconStar className="h-4 w-4" />
                  {repo.stars}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconFork className="h-4 w-4" />
                  {repo.forks}
                </span>
                <span className="ml-auto">
                  Issues: <span className="text-fg">{repo.issues}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {repo.language ? (
                  <span className="chip chip-xs cut-corners-xs">
                    {repo.language}
                  </span>
                ) : null}
                {Array.isArray(repo.topics)
                  ? repo.topics.map((t) => (
                      <span key={t} className="chip chip-xs cut-corners-xs">
                        {t}
                      </span>
                    ))
                  : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="cut-corners border border-border/80 bg-surface/60 p-5 paper-frame backdrop-blur">
              <p className="font-display text-xs tracking-[0.22em] text-muted">
                QUICK LINKS
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 break-words underline-offset-4 hover:underline"
                >
                  {repo.url}
                </a>
                {repo.homepage ? (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 break-words underline-offset-4 hover:underline"
                  >
                    {repo.homepage}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {readme ? (
        <section data-pop className="mt-6">
          <div className="cut-corners border border-border/80 bg-surface/60 p-6 paper-frame backdrop-blur">
            <p className="font-display text-xs tracking-[0.22em] text-muted">
              README
            </p>
            <div className="mt-4">
              <Markdown content={readme} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
