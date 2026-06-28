"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Source } from "@/lib/types";

interface SourceCardProps {
  source: Source;
  index: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  arxiv: { label: "arXiv", color: "bg-red-500/15 text-red-400" },
  github: { label: "GitHub", color: "bg-gray-500/15 text-gray-400" },
  web: { label: "Web", color: "bg-blue-500/15 text-blue-400" },
  huggingface: { label: "HF", color: "bg-yellow-500/15 text-yellow-400" },
  reddit: { label: "Reddit", color: "bg-orange-500/15 text-orange-400" },
};

export function SourceCard({ source, index }: SourceCardProps) {
  const meta = SOURCE_LABELS[source.source_type] ?? {
    label: source.source_type,
    color: "bg-muted text-muted-foreground",
  };

  const trustPercent = Math.round(source.trust_score * 100);

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:border-ring">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">[{index}]</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline"
      >
        {source.title}
      </a>

      <p className="line-clamp-2 text-xs text-muted-foreground">{source.snippet}</p>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${trustPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {trustPercent}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Trust score</TooltipContent>
        </Tooltip>

        {source.published_at && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(source.published_at).getFullYear()}
          </span>
        )}
      </div>
    </div>
  );
}
