"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BackdropStage from "@/components/backdrop-stage";
import RepoCarousel from "@/components/repo-carousel";
import ThemeToggle from "@/components/theme-toggle";
import { HomeHeader } from "@/features/home/home-header";
import { HomeHero } from "@/features/home/home-hero";
import { filterReposByQuery } from "@/features/home/repo-filter";
import { RepoGrid } from "@/features/home/repo-grid";
import { useHomeAnimations } from "@/features/home/use-home-animations";
import type { Repo } from "@/lib/github";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function HomeClient({ repos }: { repos: Repo[] }) {
  const baseItems = useMemo(() => repos.slice(0, 60), [repos]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const visible = useMemo(() => {
    return filterReposByQuery(baseItems, query);
  }, [baseItems, query]);

  useEffect(() => {
    if (!visible.length) return;
    if (activeIndex <= visible.length - 1) return;
    setActiveIndex(0);
  }, [activeIndex, visible.length]);

  const activeSafeIndex = visible.length
    ? clamp(activeIndex, 0, visible.length - 1)
    : 0;
  const active = visible.length ? visible[activeSafeIndex] : null;
  const activeBackdrop = active ? active.ogImageUrl : null;

  const rootRef = useRef<HTMLDivElement | null>(null);
  useHomeAnimations(rootRef);

  if (!baseItems.length) {
    return (
      <div className="min-h-dvh px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl cut-corners overflow-hidden border border-border/70 bg-surface/70 p-8 paper-frame backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-3xl tracking-wide">AkaakuHub</h1>
            <ThemeToggle />
          </div>
          <p className="mt-4 text-muted">
            GitHub API からリポジトリ一覧が取得できませんでした。ビルド時に{" "}
            <code className="rounded bg-bg/50 px-2 py-1 text-fg">
              GITHUB_TOKEN
            </code>{" "}
            を設定すると安定します。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-h-dvh">
      <HomeHeader />

      <main className="grain relative">
        <BackdropStage imageUrl={activeBackdrop} />

        <HomeHero
          active={active}
          query={query}
          onQueryChange={setQuery}
          showingCount={visible.length}
          totalCount={baseItems.length}
        />

        <div className="mt-10">
          <RepoCarousel
            repos={visible}
            activeIndex={activeSafeIndex}
            onActiveIndexChange={setActiveIndex}
          />
        </div>

        <RepoGrid repos={visible} />
      </main>
    </div>
  );
}
