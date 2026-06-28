"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceCard } from "./SourceCard";
import type { Source } from "@/lib/types";

interface SourceListProps {
  sources: Source[];
  isLoading: boolean;
}

export function SourceList({ sources, isLoading }: SourceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (sources.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Sources · {sources.length}
      </p>
      <ScrollArea className="h-full">
        <div className="space-y-2 pr-2">
          {sources.map((source, i) => (
            <SourceCard key={source.url} source={source} index={i + 1} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
