"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClassifiedsGrid,
  FilterBar,
  HeadlineNews,
  Masthead,
} from "@/components/Newspaper";
import type { NewspaperPayload, TimeRange } from "@/lib/types";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function Dashboard({
  initialData,
}: {
  initialData: NewspaperPayload;
}) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<TimeRange>(initialData.range);
  const [language, setLanguage] = useState(initialData.languageFilter ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (nextRange: TimeRange, nextLanguage: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ range: nextRange });
        if (nextLanguage) params.set("language", nextLanguage);
        const res = await fetch(`/api/repos?${params.toString()}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = (await res.json()) as NewspaperPayload;
        setData(json);
      } catch {
        setError("Unable to refresh the wire. Showing last edition.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      range === initialData.range &&
      (language || null) === initialData.languageFilter
    ) {
      return;
    }
    void fetchData(range, language);
  }, [range, language, fetchData, initialData.range, initialData.languageFilter]);

  const dateLabel = new Date(data.fetchedAt).toLocaleDateString(
    "en-US",
    DATE_FMT,
  );

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Masthead
          dateLabel={dateLabel}
          edition={data.edition}
          source={data.source}
        />

        <FilterBar
          range={range}
          language={language}
          languages={data.languages}
          loading={loading}
          onRangeChange={setRange}
          onLanguageChange={setLanguage}
        />

        {error && (
          <p className="mb-4 border border-amber-800 bg-amber-50 px-3 py-2 font-sans text-sm text-amber-900">
            {error}
          </p>
        )}

        <HeadlineNews repo={data.headline} editorial={data.editorial} />
        <ClassifiedsGrid repos={data.classifieds} />

        <footer className="mt-12 border-t border-ink pt-4 text-center font-sans text-xs uppercase tracking-widest text-ink-muted">
          © {new Date().getFullYear()} The GitHub Times · Data via GitHub REST
          API · Not affiliated with GitHub, Inc.
        </footer>
      </div>
    </main>
  );
}
