"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentEvent } from "@/lib/types";

interface AgentStreamProps {
  events: AgentEvent[];
  isRunning: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  planning: "◈",
  searching: "⊙",
  reading: "◉",
  verifying: "◎",
  writing: "✦",
  done: "✓",
  error: "✗",
};

const EVENT_COLORS: Record<string, string> = {
  planning: "text-purple-400",
  searching: "text-blue-400",
  reading: "text-cyan-400",
  verifying: "text-yellow-400",
  writing: "text-green-400",
  done: "text-emerald-400",
  error: "text-red-400",
};

export function AgentStream({ events, isRunning }: AgentStreamProps) {
  if (events.length === 0 && !isRunning) return null;

  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Agent Stream
        </span>
        {isRunning && (
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-blue-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
      </div>

      <ScrollArea className="h-48">
        <div className="space-y-2 font-mono text-xs">
          <AnimatePresence initial={false}>
            {events.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2"
              >
                <span
                  className={`mt-0.5 flex-shrink-0 ${
                    EVENT_COLORS[event.event_type] ?? "text-muted-foreground"
                  }`}
                >
                  {EVENT_ICONS[event.event_type] ?? "·"}
                </span>
                <div className="min-w-0">
                  <span className="text-muted-foreground">[{event.agent}]</span>{" "}
                  <span className="text-foreground">{event.message}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isRunning && (
            <motion.div
              className="flex items-center gap-2 text-muted-foreground"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span>·</span>
              <span>Processing…</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
