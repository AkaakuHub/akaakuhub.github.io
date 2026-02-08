type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  fork: boolean;
  html_url: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
};

export type Repo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stars: number;
  forks: number;
  issues: number;
  updatedAt: string;
  url: string;
  homepage: string | null;
  ogImageUrl: string;
  defaultBranch: string;
};

const OWNER = "AkaakuHub";

function ogImageUrl(owner: string, repo: string, cacheBuster: string) {
  // GitHub OpenGraph preview: https://opengraph.githubassets.com/<cache_buster>/<owner>/<repo>
  return `https://opengraph.githubassets.com/${encodeURIComponent(cacheBuster)}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

async function githubFetch<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Optional: helps avoid API rate limit at build time.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: "force-cache" });
  if (!res.ok) {
    let text: string | null = null;
    try {
      text = await res.text();
    } catch {
      text = null;
    }
    throw new Error(
      `GitHub API error: ${res.status} ${res.statusText} (${url})${
        text ? ` ${text}` : ""
      }`,
    );
  }
  return (await res.json()) as T;
}

export async function getRepos(): Promise<Repo[]> {
  const perPage = 100;
  const maxPages = 10;
  const all: GithubRepo[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://api.github.com/users/${OWNER}/repos` +
      `?per_page=${perPage}&page=${page}&sort=updated&direction=desc`;

    const chunk = await githubFetch<GithubRepo[]>(url);
    all.push(...chunk);
    if (chunk.length < perPage) break;
  }

  const filtered = all
    .filter((r) => !r.private && !r.fork)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

  return filtered.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    language: r.language,
    topics: Array.isArray(r.topics) ? r.topics : undefined,
    stars: r.stargazers_count,
    forks: r.forks_count,
    issues: r.open_issues_count,
    updatedAt: r.updated_at,
    url: r.html_url,
    homepage: (() => {
      if (typeof r.homepage !== "string") return null;
      const trimmed = r.homepage.trim();
      return trimmed.length ? trimmed : null;
    })(),
    ogImageUrl: ogImageUrl(OWNER, r.name, r.updated_at),
    defaultBranch: r.default_branch,
  }));
}

async function fetchRawText(url: string): Promise<string | null> {
  const res = await fetch(url, { cache: "force-cache" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return await res.text();
}

async function getReadmeViaRaw(
  repo: string,
  defaultBranch: string,
): Promise<string | null> {
  const base = `https://raw.githubusercontent.com/${OWNER}/${encodeURIComponent(repo)}/${encodeURIComponent(defaultBranch)}`;
  const candidates = [
    "README.md",
    "readme.md",
    "README.MD",
    "README",
    "readme",
  ];
  for (const name of candidates) {
    const text = await fetchRawText(`${base}/${name}`);
    if (text) return text;
  }
  return null;
}

export async function getRepoReadme(args: {
  repo: string;
  defaultBranch: string;
}): Promise<string | null> {
  const { repo, defaultBranch } = args;

  return await getReadmeViaRaw(repo, defaultBranch);
}

export function getOwner() {
  return OWNER;
}
