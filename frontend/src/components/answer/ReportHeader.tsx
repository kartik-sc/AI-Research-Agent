"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import {
  Copy, FileDown, Link2, RotateCcw, Clock, Zap, Layers, GraduationCap, BookOpen,
} from "lucide-react";
import { useResearchStore } from "@/lib/store";
import { BASE } from "@/lib/api";
import type { AgentEvent, ResearchMode } from "@/lib/types";

const MODE_META: Record<ResearchMode, { icon: React.ElementType; label: string }> = {
  quick:    { icon: Zap,           label: "Quick" },
  deep:     { icon: Layers,        label: "Deep" },
  academic: { icon: GraduationCap, label: "Academic" },
};

function computeDuration(events: AgentEvent[]): string | null {
  if (events.length < 2) return null;
  const first = new Date(events[0].timestamp).getTime();
  const last  = new Date(events[events.length - 1].timestamp).getTime();
  const s = Math.round((last - first) / 1000);
  if (s < 1) return null;
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function countAgents(events: AgentEvent[]): number {
  return new Set(events.map((e) => e.agent_name)).size;
}

interface ReportHeaderProps {
  markdown: string;
}

export function ReportHeader({ markdown }: ReportHeaderProps) {
  const { mode, agentEvents, query, sessionId, startResearch } = useResearchStore();

  const duration   = useMemo(() => computeDuration(agentEvents), [agentEvents]);
  const agentCount = useMemo(() => countAgents(agentEvents), [agentEvents]);
  const ModIcon    = MODE_META[mode]?.icon ?? Layers;
  const modeLabel  = MODE_META[mode]?.label ?? mode;

  const doExport = async (format: "markdown" | "pdf" | "bibtex") => {
    if (!sessionId) { toast.error("No session to export"); return; }

    try {
      const res = await fetch(`${BASE}/api/export/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);

      if (format === "markdown") {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `research.${format === "pdf" ? "pdf" : "bib"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  const share = () => {
    if (sessionId) {
      navigator.clipboard.writeText(`${window.location.origin}/research/${sessionId}`);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}?q=${encodeURIComponent(query)}`);
    }
    toast.success("Link copied");
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      {/* Left: meta badges */}
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
          onClick={() => doExport("markdown")}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>

        <button
          onClick={() => doExport("pdf")}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FileDown className="h-3 w-3" />
          PDF
        </button>

        {mode === "academic" && (
          <button
            onClick={() => doExport("bibtex")}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BookOpen className="h-3 w-3" />
            BibTeX
          </button>
        )}

        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          Share
        </button>

        <button
          onClick={startResearch}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Regenerate
        </button>
      </div>
    </div>
  );
}
