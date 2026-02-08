import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh px-6 py-16 md:px-10">
      <div className="mx-auto max-w-2xl cut-corners border border-border/80 bg-surface/70 p-8 paper-frame backdrop-blur">
        <h1 className="font-display text-4xl tracking-widest">NOT FOUND</h1>
        <p className="mt-3 text-muted">
          指定されたプロジェクトは見つかりませんでした。
        </p>
        <Link
          href="/"
          className="mt-6 cut-corners inline-flex items-center bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
