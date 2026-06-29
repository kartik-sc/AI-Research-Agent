"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResearchStore } from "@/lib/store";
import type { Source } from "@/lib/types";

interface SourceCardProps {
  source: Source;
  index: number; // 1-based, matches citation numbers
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  academic: { label: "Academic", color: "bg-red-500/15 text-red-400" },
  web:      { label: "Web",      color: "bg-blue-500/15 text-blue-400" },
  exa:      { label: "Exa",      color: "bg-violet-500/15 text-violet-400" },
  github:   { label: "GitHub",   color: "bg-gray-500/15 text-gray-400" },
  news:     { label: "News",     color: "bg-amber-500/15 text-amber-400" },
};

function TrustBadge({ score }: { score: number }) {
  const { label, color } =
    score >= 0.85 ? { label: "Verified", color: "bg-emerald-500/15 text-emerald-400" } :
    score >= 0.70 ? { label: "Trusted",  color: "bg-blue-500/15 text-blue-400" } :
    score >= 0.50 ? { label: "Review",   color: "bg-amber-500/15 text-amber-400" } :
                   { label: "Unverified", color: "bg-muted text-muted-foreground" };

  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

export function SourceCard({ source, index }: SourceCardProps) {
  const highlightedSourceIndex = useResearchStore((s) => s.highlightedSourceIndex);
  const isHighlighted = highlightedSourceIndex === index;

  const typeMeta = TYPE_META[source.source_type] ?? {
    label: source.source_type,
    color: "bg-muted text-muted-foreground",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      id={`source-card-${index}`}
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}
      onMouseMove={handleMouseMove}
      className={`
        spotlight-card group flex cursor-pointer flex-col gap-2 rounded-lg border bg-background p-3 transition-all
        hover:border-ring/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        ${isHighlighted ? "animate-highlight border-amber-400/70" : "border-border"}
      `}
      style={isHighlighted ? { boxShadow: "0 0 0 2px rgba(251,191,36,0.25)" } : undefined}
    >
      {/* Top row: index + favicon + domain + type */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground/40">[{index}]</span>

        {/* Favicon */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=16`}
          alt=""
          width={12}
          height={12}
          className="flex-shrink-0 rounded-sm opacity-70"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        <span className="flex-1 truncate text-[10px] font-semibold text-muted-foreground">
          {source.domain}
        </span>

        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${typeMeta.color}`}>
          {typeMeta.label}
        </span>
      </div>

      {/* Title */}
      <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground group-hover:underline group-hover:underline-offset-2">
        {source.title}
      </p>

      {/* Snippet */}
      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
        {source.snippet}
      </p>

      {/* Bottom row: trust + date */}
      <div className="flex items-center gap-2 pt-0.5">
        <Tooltip>
          <TooltipTrigger>
            <TrustBadge score={source.trust_score} />
          </TooltipTrigger>
          <TooltipContent>
            Trust score: {Math.round(source.trust_score * 100)}%
          </TooltipContent>
        </Tooltip>

        {source.published_date && (
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {source.published_date.slice(0, 4)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
