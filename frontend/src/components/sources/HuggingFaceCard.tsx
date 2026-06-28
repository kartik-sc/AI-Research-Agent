"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import type { Source } from "@/lib/types";

interface HuggingFaceCardProps {
  source: Source;
  index: number;
}

const TIER_STYLE: Record<string, string> = {
  SOTA:        "bg-emerald-500/15 text-emerald-400",
  competitive: "bg-blue-500/15 text-blue-400",
  outdated:    "bg-muted text-muted-foreground",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function HuggingFaceCard({ source, index }: HuggingFaceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = source.metadata ?? {};

  const downloads    = (meta.downloads as number) ?? 0;
  const pipelineTag  = (meta.pipeline_tag as string) ?? "";
  const tier         = (meta.performance_tier as string) ?? "competitive";
  const description  = (meta.description as string) ?? source.snippet;
  const useCases     = (meta.use_cases as string[]) ?? [];
  const tags         = ((meta.tags as string[]) ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-background p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground/40">[{index}]</span>
        {/* HuggingFace logo approximation */}
        <span className="text-sm leading-none" aria-hidden="true">🤗</span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate text-[11px] font-semibold text-foreground hover:underline"
        >
          {source.title}
        </a>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {downloads > 0 && (
          <span className="flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            <Download className="h-2.5 w-2.5" />
            {fmt(downloads)}
          </span>
        )}
        {pipelineTag && (
          <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400">
            {pipelineTag}
          </span>
        )}
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${TIER_STYLE[tier] ?? TIER_STYLE.competitive}`}>
          {tier}
        </span>
        {tags.map((t) => (
          <span key={t} className="rounded bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
            {t}
          </span>
        ))}
      </div>

      {/* One-line description always visible */}
      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
        {description}
      </p>

      {/* Collapsible use cases */}
      {useCases.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Use cases
          </button>
          {expanded && (
            <ul className="border-t border-border pt-2 list-inside list-disc space-y-0.5">
              {useCases.map((uc) => (
                <li key={uc} className="text-[10px] text-muted-foreground">{uc}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
