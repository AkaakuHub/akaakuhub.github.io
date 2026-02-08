"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import RepoCard from "@/components/repo-card";
import type { Repo } from "@/lib/github";

function nearestIndex(container: HTMLElement, itemEls: HTMLElement[]) {
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < itemEls.length; i++) {
    const el = itemEls[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const d = Math.abs(centerX - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export default function RepoCarousel({
  repos,
  activeIndex,
  onActiveIndexChange,
}: {
  repos: Repo[];
  activeIndex: number;
  onActiveIndexChange: (idx: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const items = useMemo(() => repos, [repos]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const els = itemRefs.current.filter(Boolean) as HTMLElement[];
        if (!els.length) return;
        const idx = nearestIndex(scroller, els);
        if (!isDragging) onActiveIndexChange(idx);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isDragging, onActiveIndexChange]);

  function scrollToIndex(idx: number) {
    const scroller = scrollerRef.current;
    const el = itemRefs.current[idx];
    if (!scroller || !el) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  const hasItems = items.length > 0;
  const lastIndex = hasItems ? items.length - 1 : 0;

  return (
    <section aria-label="Projects carousel">
      <div className="flex items-center justify-between gap-3 px-6 md:px-10">
        <h2 className="font-display text-sm tracking-[0.22em] text-muted">
          PROJECT STRIP
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cut-corners border border-border/80 bg-surface/60 px-3 py-2 text-xs text-fg backdrop-blur transition hover:bg-surface/80"
            disabled={!hasItems}
            onClick={() => {
              if (!hasItems) return;
              const next = Math.max(0, activeIndex - 1);
              onActiveIndexChange(next);
              scrollToIndex(next);
            }}
          >
            Prev
          </button>
          <button
            type="button"
            className="cut-corners border border-border/80 bg-surface/60 px-3 py-2 text-xs text-fg backdrop-blur transition hover:bg-surface/80"
            disabled={!hasItems}
            onClick={() => {
              if (!hasItems) return;
              const next = Math.min(lastIndex, activeIndex + 1);
              onActiveIndexChange(next);
              scrollToIndex(next);
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className={clsx(
          "mt-4 flex gap-4 overflow-x-auto px-6 pb-4 md:px-10",
          "snap-x snap-mandatory scroll-px-6 md:scroll-px-10",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
      >
        {items.map((repo, idx) => (
          <div
            key={repo.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="snap-center"
          >
            <RepoCard
              repo={repo}
              active={idx === activeIndex}
              onSelect={() => onActiveIndexChange(idx)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
