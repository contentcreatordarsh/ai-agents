export type TimeRange = "daily" | "weekly";

export type GitHubOwner = {
  login: string;
  avatar_url: string;
};

export type RepoItem = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  owner: GitHubOwner;
  created_at: string;
  pushed_at: string;
};

export type NewspaperPayload = {
  headline: RepoItem;
  editorial: string;
  classifieds: RepoItem[];
  languages: string[];
  range: TimeRange;
  languageFilter: string | null;
  source: "live" | "mock";
  fetchedAt: string;
  edition: number;
};
