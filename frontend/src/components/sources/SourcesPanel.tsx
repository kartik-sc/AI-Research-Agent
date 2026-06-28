"use client";

import { useState } from "react";
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

export function SourcesPanel({ sources, isLoading }: SourcesPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered =
    activeFilter === "all"
      ? sources
      : sources.filter((s) => s.source_type === activeFilter);

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
          Sources <span className="ml-1 text-muted-foreground">({sources.length})</span>
        </p>
      </div>

      {/* Filter chips — only show filters that have matching sources */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.filter(
          ({ key }) => key === "all" || sources.some((s) => s.source_type === key)
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
            filtered.map((source) => {
              const originalIndex = sources.indexOf(source) + 1;

              if (source.source_type === "github") {
                return (
                  <GitHubCard key={source.url} source={source} index={originalIndex} />
                );
              }
              if (source.source_type === "huggingface") {
                return (
                  <HuggingFaceCard key={source.url} source={source} index={originalIndex} />
                );
              }
              return (
                <SourceCard key={source.url} source={source} index={originalIndex} />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
