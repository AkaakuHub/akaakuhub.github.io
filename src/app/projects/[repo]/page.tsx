import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectClient from "@/features/project/project-client";
import { getRepoReadme, getRepos } from "@/lib/github";

export async function generateStaticParams() {
  const repos = await getRepos();
  return repos.map((r) => ({ repo: r.name }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const repos = await getRepos();
  const found = repos.find((r) => r.name === repo);
  if (!found) notFound();

  const readme = await getRepoReadme({
    repo: found.name,
    defaultBranch: found.defaultBranch,
  });

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            href="/"
            className="cut-corners border border-border/80 bg-surface/60 px-4 py-2 text-sm text-muted backdrop-blur transition hover:bg-surface/80 hover:text-fg"
          >
            BACK
          </Link>
        </div>

        <ProjectClient repo={found} readme={readme} />
      </div>
    </div>
  );
}
