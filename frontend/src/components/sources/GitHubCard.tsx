"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, GitFork } from "lucide-react";
import type { Source } from "@/lib/types";

interface GitHubCardProps {
  source: Source;
  index: number;
}

const HEALTH_STYLE: Record<string, string> = {
  active:   "bg-emerald-500/15 text-emerald-400",
  moderate: "bg-amber-500/15 text-amber-400",
  stale:    "bg-red-500/15 text-red-400",
};

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function GitHubCard({ source, index }: GitHubCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = source.metadata ?? {};

  const stars        = (meta.stars as number) ?? 0;
  const forks        = (meta.forks as number) ?? 0;
  const language     = (meta.language as string) ?? "";
  const license      = (meta.license as string) ?? "";
  const health       = (meta.activity_health as string) ?? "moderate";
  const summary      = (meta.summary as string) ?? source.snippet;
  const dependencies = (meta.key_dependencies as string[]) ?? [];
  const limitations  = (meta.limitations as string[]) ?? [];

  const [owner, repo] = source.title.includes("/")
    ? source.title.split("/")
    : ["", source.title];

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-background p-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground/40">[{index}]</span>
        {/* GitHub icon */}
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 flex-shrink-0 text-foreground/70" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate text-[11px] font-semibold text-foreground hover:underline"
        >
          {owner && <span className="text-muted-foreground">{owner}/</span>}{repo}
        </a>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {stars > 0 && (
          <span className="flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            <Star className="h-2.5 w-2.5" />
            {fmt(stars)}
          </span>
        )}
        {forks > 0 && (
          <span className="flex items-center gap-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            <GitFork className="h-2.5 w-2.5" />
            {fmt(forks)}
          </span>
        )}
        {language && (
          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
            {language}
          </span>
        )}
        {license && (
          <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {license}
          </span>
        )}
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${HEALTH_STYLE[health] ?? HEALTH_STYLE.moderate}`}>
          {health}
        </span>
      </div>

      {/* Collapsible architecture summary */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Architecture summary
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{summary}</p>
          {dependencies.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                Key deps
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {dependencies.map((d) => (
                  <span key={d} className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {limitations.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                Limitations
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {limitations.map((l) => (
                  <li key={l} className="text-[10px] text-muted-foreground">{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
