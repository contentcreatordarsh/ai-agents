import { MOCK_REPOS } from "./mock-data";
import { generateEditorial } from "./editorial";
import type { NewspaperPayload, RepoItem, TimeRange } from "./types";

const GITHUB_API = "https://api.github.com/search/repositories";

type GitHubSearchResponse = {
  items: Array<{
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    topics?: string[];
    owner: { login: string; avatar_url: string };
    created_at: string;
    pushed_at: string;
  }>;
};

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

function buildQuery(range: TimeRange, language: string | null): string {
  const pushedSince = range === "daily" ? isoDateDaysAgo(1) : isoDateDaysAgo(7);
  const parts = [`pushed:>${pushedSince}`, "stars:>50"];
  if (language) {
    parts.push(`language:${language}`);
  }
  return parts.join("+");
}

function mapItem(raw: GitHubSearchResponse["items"][number]): RepoItem {
  return {
    id: raw.id,
    name: raw.name,
    full_name: raw.full_name,
    html_url: raw.html_url,
    description: raw.description,
    language: raw.language,
    stargazers_count: raw.stargazers_count,
    forks_count: raw.forks_count,
    open_issues_count: raw.open_issues_count,
    topics: raw.topics ?? [],
    owner: raw.owner,
    created_at: raw.created_at,
    pushed_at: raw.pushed_at,
  };
}

function pickClassifieds(repos: RepoItem[], limit = 6): RepoItem[] {
  const picked: RepoItem[] = [];
  const seenLanguages = new Set<string>();

  for (const repo of repos) {
    const lang = repo.language ?? "Other";
    if (!seenLanguages.has(lang)) {
      seenLanguages.add(lang);
      picked.push(repo);
      if (picked.length >= limit) break;
    }
  }

  if (picked.length < limit) {
    for (const repo of repos) {
      if (!picked.some((p) => p.id === repo.id)) {
        picked.push(repo);
        if (picked.length >= limit) break;
      }
    }
  }

  return picked;
}

function filterMock(
  repos: RepoItem[],
  language: string | null,
): RepoItem[] {
  const sorted = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  if (!language) return sorted;
  return sorted.filter(
    (r) => (r.language ?? "Other").toLowerCase() === language.toLowerCase(),
  );
}

function editionNumber(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function encodeGithubQuery(q: string): string {
  // GitHub qualifiers are joined with '+'; encodeURIComponent would turn '+' into '%2B' and break the query.
  return q
    .split("+")
    .map((part) => encodeURIComponent(part))
    .join("+");
}

async function fetchLiveRepos(
  range: TimeRange,
  language: string | null,
): Promise<RepoItem[] | null> {
  const q = buildQuery(range, language);
  const url = `${GITHUB_API}?q=${encodeGithubQuery(q)}&sort=stars&order=desc&per_page=30`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "The-GitHub-Times/1.0",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (res.status === 403 || res.status === 429) {
      console.warn(
        `[github-times] Rate limited (${res.status}); using mock data.`,
      );
      return null;
    }

    if (!res.ok) {
      console.warn(`[github-times] GitHub API ${res.status}; using mock data.`);
      return null;
    }

    const data = (await res.json()) as GitHubSearchResponse;
    if (!data.items?.length) return null;
    return data.items.map(mapItem);
  } catch (err) {
    console.warn("[github-times] GitHub fetch failed:", err);
    return null;
  }
}

export async function buildNewspaper(
  range: TimeRange = "daily",
  language: string | null = null,
): Promise<NewspaperPayload> {
  let repos = await fetchLiveRepos(range, language);
  let source: "live" | "mock" = "live";

  if (!repos?.length) {
    repos = filterMock(MOCK_REPOS, language);
    source = "mock";
  }

  if (!repos.length) {
    repos = filterMock(MOCK_REPOS, null);
    source = "mock";
  }

  const headline = repos[0];
  const classifieds = pickClassifieds(repos, 6);
  const languages = [
    ...new Set(
      repos
        .map((r) => r.language)
        .filter((l): l is string => Boolean(l)),
    ),
  ].sort();

  const filterLanguages =
    languages.length > 0
      ? languages
      : [
          ...new Set(
            MOCK_REPOS.map((r) => r.language).filter((l): l is string =>
              Boolean(l),
            ),
          ),
        ].sort();

  return {
    headline,
    editorial: generateEditorial(headline, range),
    classifieds,
    languages: filterLanguages,
    range,
    languageFilter: language,
    source,
    fetchedAt: new Date().toISOString(),
    edition: editionNumber(),
  };
}
