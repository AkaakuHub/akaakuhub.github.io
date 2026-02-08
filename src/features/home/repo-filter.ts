import type { Repo } from "@/lib/github";

function norm(s: string) {
  return s.trim().toLowerCase();
}

function normalizeQuery(q: string) {
  return norm(q);
}

export function filterReposByQuery(repos: Repo[], query: string) {
  const q = normalizeQuery(query);
  if (!q) return repos;

  return repos.filter((repo) => {
    if (norm(repo.name).includes(q)) return true;
    if (norm(repo.fullName).includes(q)) return true;

    if (repo.description) {
      if (norm(repo.description).includes(q)) return true;
    }

    if (repo.language) {
      if (norm(repo.language).includes(q)) return true;
    }

    if (Array.isArray(repo.topics)) {
      for (const t of repo.topics) {
        if (norm(t).includes(q)) return true;
      }
    }

    return false;
  });
}
