"use client";

import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { useResearchStore } from "@/lib/store";

export function ThreadBreadcrumb() {
  const { threadHistory, query, resetResearch } = useResearchStore();

  if (threadHistory.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 px-5 py-2 text-[10px] text-muted-foreground/60 border-b border-border bg-muted/20">
      <span className="mr-1 uppercase tracking-wider text-muted-foreground/50">
        Continuing from
      </span>
      {threadHistory.map((entry) => (
        <span key={entry.sessionId} className="flex items-center gap-1">
          <Link
            href={`/research/${entry.sessionId}`}
            className="max-w-[160px] truncate hover:text-foreground transition-colors"
            title={entry.query}
          >
            {entry.query.length > 30 ? entry.query.slice(0, 29) + "…" : entry.query}
          </Link>
          <ChevronRight className="h-2.5 w-2.5 flex-shrink-0" />
        </span>
      ))}
      <span className="max-w-[200px] truncate text-foreground/70">
        {query.length > 36 ? query.slice(0, 35) + "…" : query}
      </span>
      <button
        onClick={resetResearch}
        aria-label="Clear thread"
        className="ml-2 flex-shrink-0 rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
