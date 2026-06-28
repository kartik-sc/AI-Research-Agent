"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentEvent } from "@/lib/types";

interface AgentStreamProps {
  events: AgentEvent[];
  isRunning: boolean;
  sourceCount?: number;
}

// Per-agent visual identity
const AGENT_META: Record<string, { dot: string; badge: string }> = {
  Planner:    { dot: "bg-teal-400",   badge: "text-teal-400   bg-teal-400/10" },
  Researcher: { dot: "bg-blue-400",   badge: "text-blue-400   bg-blue-400/10" },
  Critic:     { dot: "bg-amber-400",  badge: "text-amber-400  bg-amber-400/10" },
  Writer:     { dot: "bg-rose-400",   badge: "text-rose-400   bg-rose-400/10" },
  System:     { dot: "bg-slate-400",  badge: "text-slate-400  bg-slate-400/10" },
};

function agentMeta(name: string) {
  return AGENT_META[name] ?? { dot: "bg-slate-400", badge: "text-slate-400 bg-slate-400/10" };
}

function SourceIcon({ message }: { message: string }) {
  const lower = message.toLowerCase();
  if (lower.includes("arxiv") || lower.includes("academic")) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-bold text-red-400">
        arXiv
      </span>
    );
  }
  if (lower.includes("web") || lower.includes("tavily")) {
    return <Globe className="inline h-3 w-3 text-blue-400" />;
  }
  if (lower.includes("exa")) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1 py-0.5 text-[9px] font-bold text-violet-400">
        Exa
      </span>
    );
  }
  return null;
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

// ── Collapsed badge ──────────────────────────────────────────────────────────

function CollapsedBadge({
  eventCount,
  sourceCount,
  onExpand,
}: {
  eventCount: number;
  sourceCount: number;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      <span>{eventCount} events</span>
      {sourceCount > 0 && (
        <>
          <span className="text-border">·</span>
          <span>{sourceCount} sources found</span>
        </>
      )}
      <ChevronDown className="h-3 w-3 opacity-60" />
    </button>
  );
}

// ── Full stream panel ────────────────────────────────────────────────────────

export function AgentStream({ events, isRunning, sourceCount = 0 }: AgentStreamProps) {
  const [expanded, setExpanded] = useState(true);

  if (events.length === 0 && !isRunning) return null;

  // Collapsed state (research complete)
  if (!isRunning && !expanded) {
    return (
      <CollapsedBadge
        eventCount={events.length}
        sourceCount={sourceCount}
        onExpand={() => setExpanded(true)}
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <motion.div
                className="h-2 w-2 rounded-full bg-blue-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <span className="text-xs font-medium text-foreground">Researching…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-foreground">Research complete</span>
            </>
          )}
        </div>

        {!isRunning && (
          <button
            onClick={() => setExpanded(false)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Event list */}
      <ScrollArea className="max-h-52 px-4 pb-3">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const meta = agentMeta(event.agent_name);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-2.5"
                >
                  {/* Colored dot */}
                  <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.dot}`} />

                  {/* Agent badge */}
                  <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${meta.badge}`}>
                    {event.agent_name}
                  </span>

                  {/* Message + source icon */}
                  <span className="flex-1 text-xs leading-relaxed text-muted-foreground">
                    {event.event_type === "action" && (
                      <SourceIcon message={event.message} />
                    )}{" "}
                    {event.message}
                  </span>

                  {/* Timestamp */}
                  <span className="flex-shrink-0 font-mono text-[9px] text-muted-foreground/40">
                    {formatTime(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pulsing cursor while running */}
          {isRunning && (
            <motion.div
              className="flex items-center gap-2.5 pl-4"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground/50">Working…</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
