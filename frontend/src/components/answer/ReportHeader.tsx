"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Copy, FileDown, Link2, RotateCcw, Clock, Zap, Layers, GraduationCap } from "lucide-react";
import { useResearchStore } from "@/lib/store";
import type { AgentEvent, ResearchMode } from "@/lib/types";

const MODE_META: Record<ResearchMode, { icon: React.ElementType; label: string }> = {
  quick:    { icon: Zap,           label: "Quick" },
  deep:     { icon: Layers,        label: "Deep" },
  academic: { icon: GraduationCap, label: "Academic" },
};

function computeDuration(events: AgentEvent[]): string | null {
  if (events.length < 2) return null;
  const first = new Date(events[0].timestamp).getTime();
  const last = new Date(events[events.length - 1].timestamp).getTime();
  const ms = last - first;
  if (ms < 1000) return null;
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function countAgents(events: AgentEvent[]): number {
  return new Set(events.map((e) => e.agent_name)).size;
}

interface ReportHeaderProps {
  markdown: string;
}

export function ReportHeader({ markdown }: ReportHeaderProps) {
  const { mode, agentEvents, query, startResearch } = useResearchStore();

  const duration = useMemo(() => computeDuration(agentEvents), [agentEvents]);
  const agentCount = useMemo(() => countAgents(agentEvents), [agentEvents]);
  const ModIcon = MODE_META[mode]?.icon ?? Layers;
  const modeLabel = MODE_META[mode]?.label ?? mode;

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copied to clipboard");
  };

  const exportPdf = () => {
    toast.info("PDF export coming soon");
  };

  const share = () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const regenerate = () => {
    startResearch();
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <ModIcon className="h-3 w-3" />
          {modeLabel}
        </span>

        {agentCount > 0 && (
          <span className="text-[11px] text-muted-foreground/60">
            {agentCount} agent{agentCount !== 1 ? "s" : ""}
          </span>
        )}

        {duration && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Clock className="h-2.5 w-2.5" />
            {duration}
          </span>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={copyMarkdown}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>

        <button
          onClick={exportPdf}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FileDown className="h-3 w-3" />
          Export PDF
        </button>

        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          Share
        </button>

        <button
          onClick={regenerate}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Regenerate
        </button>
      </div>
    </div>
  );
}
