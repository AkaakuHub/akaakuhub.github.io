"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export function HomeHeader() {
  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-start gap-3 px-4 py-4 sm:items-center sm:px-6 md:px-10">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:flex-nowrap md:gap-4">
          <span className="font-display min-w-0 truncate text-2xl tracking-[0.08em]">
            AkaakuHub
          </span>
          <Link href="/" className="group inline-flex items-baseline gap-3">
            <span className="chip cut-corners-xs transition group-hover:text-fg">
              APP ARCHIVE
            </span>
          </Link>
          {/* TODO: リンクそのうち整理して綺麗にかく */}
          <Link
            href="https://blog.akaaku.net"
            className="group inline-flex items-baseline gap-3"
          >
            <span className="chip cut-corners-xs transition group-hover:text-fg">
              BLOG
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 justify-self-end self-start sm:self-center">
          <a
            href="https://github.com/AkaakuHub"
            target="_blank"
            rel="noreferrer"
            className="hidden cut-corners border border-border/80 bg-surface/55 px-3 py-2 text-sm text-muted backdrop-blur transition hover:bg-surface/75 hover:text-fg md:inline-flex"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
