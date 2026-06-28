"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { KnowledgeNode } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  concept:   "bg-purple-500/15 text-purple-400",
  person:    "bg-teal-500/15 text-teal-400",
  paper:     "bg-blue-500/15 text-blue-400",
  model:     "bg-orange-500/15 text-orange-400",
  framework: "bg-amber-500/15 text-amber-400",
  dataset:   "bg-green-500/15 text-green-400",
};

interface GraphTooltipProps {
  node: KnowledgeNode;
  x: number;
  y: number;
  onResearch: () => void;
}

export function GraphTooltip({ node, x, y, onResearch }: GraphTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 14, top: y - 60 });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      left: x + rect.width + 14 > vw ? x - rect.width - 14 : x + 14,
      top: y - 60 + rect.height > vh ? vh - rect.height - 8 : Math.max(8, y - 60),
    });
  }, [x, y]);

  const typeColor = TYPE_COLORS[node.type] ?? "bg-muted text-muted-foreground";

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 50 }}
      className="w-52 rounded-lg border border-border bg-card p-3 shadow-xl"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-snug text-foreground">
          {node.label}
        </p>
        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${typeColor}`}>
          {node.type}
        </span>
      </div>

      {node.description && (
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
          {node.description}
        </p>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onResearch(); }}
        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
      >
        Research this
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
