"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubCard } from "./GitHubCard";
import { HuggingFaceCard } from "./HuggingFaceCard";
import { SourceCard } from "./SourceCard";
import type { Source } from "@/lib/types";

interface SourcesPanelProps {
  sources: Source[];
  isLoading: boolean;
}

const FILTER_OPTIONS = [
  { key: "all",         label: "All" },
  { key: "web",         label: "Web" },
  { key: "academic",    label: "Academic" },
  { key: "github",      label: "GitHub" },
  { key: "huggingface", label: "Models" },
  { key: "news",        label: "News" },
] as const;

type FilterKey = typeof FILTER_OPTIONS[number]["key"];
type SortKey   = "trust" | "recency" | "relevance";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "trust",     label: "Trust" },
  { key: "recency",   label: "Recency" },
  { key: "relevance", label: "Relevance" },
];

// Each source carries its citation number (position in the original,
// de-duplicated list) so sorting/filtering never desyncs the [n] references.
interface RankedSource {
  source: Source;
  citationIndex: number;
}

function sortRanked(items: RankedSource[], sort: SortKey): RankedSource[] {
  const copy = [...items];
  if (sort === "trust") {
    return copy.sort((a, b) => b.source.trust_score - a.source.trust_score);
  }
  if (sort === "recency") {
    return copy.sort((a, b) => {
      const da = a.source.published_date ?? "";
      const db = b.source.published_date ?? "";
      return db.localeCompare(da);
    });
  }
  // relevance = original order
  return copy;
}

export function SourcesPanel({ sources, isLoading }: SourcesPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("relevance");

  // De-duplicate by URL once. The backend can occasionally emit repeated
  // URLs; without this, duplicate React keys break list reconciliation and
  // the filter/sort controls silently stop updating the DOM.
  const ranked = useMemo<RankedSource[]>(() => {
    const seen = new Set<string>();
    const out: RankedSource[] = [];
    sources.forEach((source) => {
      const key = source.url || `${source.title}:${out.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ source, citationIndex: out.length + 1 });
    });
    return out;
  }, [sources]);

  const filtered = useMemo(() => {
    const base = activeFilter === "all"
      ? ranked
      : ranked.filter((r) => r.source.source_type === activeFilter);
    return sortRanked(base, sortBy);
  }, [ranked, activeFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-14 rounded-full" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (sources.length === 0) return null;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          Sources <span className="ml-1 text-muted-foreground">({ranked.length})</span>
        </p>
        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground outline-none hover:bg-accent cursor-pointer"
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Filter chips — only show filters that have matching sources */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.filter(
          ({ key }) => key === "all" || ranked.some((r) => r.source.source_type === key)
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              activeFilter === key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-1">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-muted-foreground/50">
              No {activeFilter} sources
            </p>
          ) : (
            filtered.map(({ source, citationIndex }) => {
              // Stable, unique key even if two sources share a URL.
              const key = `${source.url}#${citationIndex}`;

              if (source.source_type === "github") {
                return <GitHubCard key={key} source={source} index={citationIndex} />;
              }
              if (source.source_type === "huggingface") {
                return <HuggingFaceCard key={key} source={source} index={citationIndex} />;
              }
              return <SourceCard key={key} source={source} index={citationIndex} />;
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
