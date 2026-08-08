import type { RepoItem } from "@/lib/types";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

type Props = {
  dateLabel: string;
  edition: number;
  source: "live" | "mock";
};

export function Masthead({ dateLabel, edition, source }: Props) {
  return (
    <header className="border-b-4 border-double border-ink pb-4 text-center">
      <p className="font-sans text-xs uppercase tracking-[0.35em] text-ink-muted">
        Est. {new Date().getFullYear()} · Open Source Intelligence Bureau
      </p>
      <h1 className="font-headline mt-2 text-5xl font-black uppercase leading-none tracking-tight md:text-7xl">
        The GitHub Times
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-sans text-xs uppercase tracking-widest text-ink-muted">
        <span>{dateLabel}</span>
        <span>·</span>
        <span>Edition No. {edition}</span>
        <span>·</span>
        <span>Price: Free as in Speech</span>
        <span>·</span>
        <span
          className={
            source === "live" ? "text-emerald-800" : "text-amber-800"
          }
        >
          Wire: {source === "live" ? "Live" : "Archive (Mock)"}
        </span>
      </div>
    </header>
  );
}

type FilterBarProps = {
  range: "daily" | "weekly";
  language: string;
  languages: string[];
  loading: boolean;
  onRangeChange: (range: "daily" | "weekly") => void;
  onLanguageChange: (language: string) => void;
};

export function FilterBar({
  range,
  language,
  languages,
  loading,
  onRangeChange,
  onLanguageChange,
}: FilterBarProps) {
  return (
    <section className="my-6 border-y border-ink py-3 font-sans text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="uppercase tracking-widest text-ink-muted">
          Newsroom Filters
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-muted">
              Edition
            </span>
            <select
              value={range}
              disabled={loading}
              onChange={(e) =>
                onRangeChange(e.target.value as "daily" | "weekly")
              }
              className="border border-ink bg-paper px-2 py-1 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-muted">
              Language
            </span>
            <select
              value={language}
              disabled={loading}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="border border-ink bg-paper px-2 py-1 text-sm"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
          {loading && (
            <span className="text-xs italic text-ink-muted">Updating…</span>
          )}
        </div>
      </div>
    </section>
  );
}

type HeadlineProps = {
  repo: RepoItem;
  editorial: string;
};

export function HeadlineNews({ repo, editorial }: HeadlineProps) {
  return (
    <article className="mb-10">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-ink-muted">
        Headline News · Trending Repository of the Day
      </p>
      <h2 className="font-headline mt-2 text-4xl font-bold leading-tight md:text-5xl">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {repo.full_name}
        </a>{" "}
        Captures the Spotlight
      </h2>
      <p className="mt-2 font-sans text-sm italic text-ink-muted">
        By The GitHub Times Staff · @{repo.owner.login}
      </p>

      <div className="mt-6 columns-1 gap-8 md:columns-2">
        {editorial.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            className="mb-4 text-justify font-body text-lg leading-relaxed first:mt-0"
          >
            {i === 0 && (
              <span className="float-left mr-2 font-headline text-6xl leading-none">
                {paragraph.charAt(0)}
              </span>
            )}
            {i === 0 ? paragraph.slice(1) : paragraph}
          </p>
        ))}
      </div>

      <aside className="mt-6 border border-ink bg-newsprint-dark p-4 font-sans text-sm">
        <p className="font-bold uppercase tracking-wider">Market Data</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <li>★ {formatNumber(repo.stargazers_count)} stars</li>
          <li>⑂ {formatNumber(repo.forks_count)} forks</li>
          <li>⚑ {formatNumber(repo.open_issues_count)} issues</li>
          <li>Lang: {repo.language ?? "—"}</li>
        </ul>
        {repo.topics.length > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Topics: {repo.topics.join(" · ")}
          </p>
        )}
      </aside>
    </article>
  );
}

type ClassifiedsProps = {
  repos: RepoItem[];
};

export function ClassifiedsGrid({ repos }: ClassifiedsProps) {
  return (
    <section>
      <div className="border-t-4 border-ink pt-4">
        <h3 className="font-headline text-3xl font-bold uppercase">
          Classifieds &amp; Tech Briefs
        </h3>
        <p className="mt-1 font-sans text-sm italic text-ink-muted">
          Top repositories by language desk — stars, forks, issues, and beats
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <article
            key={repo.id}
            className="border border-ink bg-paper p-4 shadow-[4px_4px_0_0_#1a1a1a]"
          >
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              {repo.language ?? "Polyglot"} Desk
            </p>
            <h4 className="font-headline mt-1 text-xl font-bold leading-snug">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {repo.name}
              </a>
            </h4>
            <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed">
              {repo.description ?? "No description filed with the bureau."}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-ink pt-3 font-sans text-xs">
              <div>
                <dt className="uppercase text-ink-muted">Stars</dt>
                <dd className="font-bold">{formatNumber(repo.stargazers_count)}</dd>
              </div>
              <div>
                <dt className="uppercase text-ink-muted">Forks</dt>
                <dd className="font-bold">{formatNumber(repo.forks_count)}</dd>
              </div>
              <div>
                <dt className="uppercase text-ink-muted">Issues</dt>
                <dd className="font-bold">
                  {formatNumber(repo.open_issues_count)}
                </dd>
              </div>
            </dl>
            {repo.topics.length > 0 && (
              <p className="mt-2 font-sans text-[10px] uppercase tracking-wide text-ink-muted">
                {repo.topics.slice(0, 3).join(" · ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
