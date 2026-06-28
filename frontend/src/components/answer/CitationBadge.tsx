"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Source } from "@/lib/types";

interface CitationBadgeProps {
  number: number;
  source?: Source;
  onClick: () => void;
}

export function CitationBadge({ number, source, onClick }: CitationBadgeProps) {
  const badge = (
    <button
      onClick={onClick}
      className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary/15 px-1 font-mono text-[10px] font-semibold text-primary transition-colors hover:bg-primary/25 hover:text-primary"
    >
      {number}
    </button>
  );

  if (!source) return badge;

  return (
    <Tooltip>
      <TooltipTrigger className="inline">{badge}</TooltipTrigger>
      <TooltipContent className="max-w-56">
        <p className="font-medium leading-snug">{source.title}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{source.domain}</p>
      </TooltipContent>
    </Tooltip>
  );
}
