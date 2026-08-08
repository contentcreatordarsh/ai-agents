import type { RepoItem, TimeRange } from "./types";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function rangeLabel(range: TimeRange): string {
  return range === "daily" ? "the past 24 hours" : "the past week";
}

/** Structured editorial copy from repository metadata (no external LLM required). */
export function generateEditorial(repo: RepoItem, range: TimeRange): string {
  const topics =
    repo.topics.length > 0
      ? repo.topics.slice(0, 4).join(", ")
      : "general open source";

  const desc =
    repo.description?.trim() ||
    "a project that has captured developer attention without a formal abstract";

  const paragraphs = [
    `In ${rangeLabel(range)}, ${repo.full_name} has emerged as the lead story on the GitHub wire, climbing to ${formatNumber(repo.stargazers_count)} stars with ${formatNumber(repo.forks_count)} forks and ${formatNumber(repo.open_issues_count)} issues on the docket. Maintained by @${repo.owner.login}, the repository centers on ${desc.toLowerCase().replace(/\.$/, "")}.`,

    `Desk analysts note the primary language is ${repo.language ?? "polyglot"}, with coverage spanning ${topics}. Community momentum suggests sustained interest from contributors evaluating production readiness, documentation quality, and issue triage velocity.`,

    `Market watchers advise readers to monitor fork growth and open-issue trends as leading indicators. Whether ${repo.name} becomes a staple dependency or a passing headline depends on release cadence and maintainer responsiveness in the weeks ahead.`,
  ];

  return paragraphs.join("\n\n");
}
