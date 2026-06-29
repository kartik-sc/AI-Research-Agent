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
      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0a0c0f] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      <span className="font-mono">{eventCount} events</span>
      {sourceCount > 0 && (
        <>
          <span className="text-border">·</span>
          <span className="font-mono">{sourceCount} sources</span>
        </>
      )}
      <ChevronDown className="h-3 w-3 opacity-40" />
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
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0c0f]"
    >
      {/* Terminal header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <div className={`h-2.5 w-2.5 rounded-full ${isRunning ? "bg-emerald-400" : "bg-emerald-400/40"}`} />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {isRunning ? "agent-pipeline — running" : "agent-pipeline — complete"}
          </span>
        </div>

        {!isRunning && (
          <button
            onClick={() => setExpanded(false)}
            className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Event list */}
      <ScrollArea className="max-h-56 px-4 py-3">
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const meta = agentMeta(event.agent_name);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2.5"
                >
                  {/* Agent badge */}
                  <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${meta.badge}`}>
                    {event.agent_name}
                  </span>

                  {/* Message + source icon */}
                  <span className="flex-1 font-mono text-[11px] leading-relaxed text-muted-foreground/80">
                    {event.event_type === "action" && (
                      <SourceIcon message={event.message} />
                    )}{" "}
                    {event.message}
                  </span>

                  {/* Timestamp */}
                  <span className="flex-shrink-0 font-mono text-[9px] text-muted-foreground/25">
                    {formatTime(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Blinking cursor while running */}
          {isRunning && (
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground/40">
              <span>$</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1, ease: "steps(1)" }}
              >
                ▋
              </motion.span>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
