"use client";

import { Search, ListChecks, Globe, Network, CheckCircle2 } from "lucide-react";
import type { SessionDetail } from "@/lib/types";

interface ResearchTimelineProps {
  session: SessionDetail;
}

function formatDateTime(ts: string) {
  try {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function Chips({ items }: { items: [string, number][] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map(([label, count]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          <span className="capitalize">{label}</span>
          <span className="text-white/30">·</span>
          <span>{count}</span>
        </span>
      ))}
    </div>
  );
}

interface Milestone {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  meta: string;
  chips?: [string, number][];
  detail?: string;
}

export function ResearchTimeline({ session }: ResearchTimelineProps) {
  const sourceBreakdown = Object.entries(groupBy(session.sources, (s) => s.source_type));
  const nodeBreakdown = Object.entries(groupBy(session.knowledge_nodes, (n) => n.type));
  const modeLabel = session.mode === "quick" ? "Quick" : session.mode === "deep" ? "Deep" : "Academic";

  const milestones: Milestone[] = [
    {
      icon: <Search className="h-3.5 w-3.5" />,
      iconBg: "bg-teal-400/15 text-teal-400",
      title: "Research Initiated",
      meta: formatDateTime(session.created_at),
      detail: `${modeLabel} mode`,
    },
    {
      icon: <ListChecks className="h-3.5 w-3.5" />,
      iconBg: "bg-blue-400/15 text-blue-400",
      title: "Questions Mapped",
      meta: `${session.sub_questions.length} sub-question${session.sub_questions.length !== 1 ? "s" : ""}`,
      chips: session.sub_questions.slice(0, 4).map((q) => [
        q.length > 42 ? q.slice(0, 41) + "…" : q,
        0,
      ]) as [string, number][],
    },
    {
      icon: <Globe className="h-3.5 w-3.5" />,
      iconBg: "bg-violet-400/15 text-violet-400",
      title: "Sources Gathered",
      meta: `${session.sources.length} source${session.sources.length !== 1 ? "s" : ""}`,
      chips: sourceBreakdown,
    },
    {
      icon: <Network className="h-3.5 w-3.5" />,
      iconBg: "bg-amber-400/15 text-amber-400",
      title: "Entities Extracted",
      meta: `${session.knowledge_nodes.length} node${session.knowledge_nodes.length !== 1 ? "s" : ""}`,
      chips: nodeBreakdown,
    },
    {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      iconBg: "bg-emerald-400/15 text-emerald-400",
      title: "Report Generated",
      meta: session.completed_at ? formatDateTime(session.completed_at) : "—",
      detail: session.duration_seconds ? `Completed in ${formatDuration(session.duration_seconds)}` : undefined,
    },
  ];

  return (
    <div className="py-2">
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/[0.06]" />

        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Icon dot */}
              <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${m.iconBg} border border-white/[0.07]`}>
                {m.icon}
              </div>

              {/* Card */}
              <div className="flex-1 rounded-xl border border-white/[0.07] bg-[#0a0c0f] px-4 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">{m.title}</span>
                  <span className="flex-shrink-0 font-mono text-[11px] text-muted-foreground/60">{m.meta}</span>
                </div>
                {m.detail && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground/60">{m.detail}</p>
                )}
                {m.chips && m.chips.length > 0 && (
                  <Chips items={m.chips} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
