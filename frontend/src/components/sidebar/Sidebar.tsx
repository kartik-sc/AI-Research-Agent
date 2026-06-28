"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteSession } from "@/lib/api";
import type { SessionSummary } from "@/lib/types";

interface SidebarProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionDelete: (id: string) => void;
}

const MODE_COLORS: Record<string, string> = {
  quick: "bg-green-500/15 text-green-400",
  deep: "bg-blue-500/15 text-blue-400",
  academic: "bg-purple-500/15 text-purple-400",
  repository: "bg-orange-500/15 text-orange-400",
};

export function Sidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionDelete,
}: SidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSession(id);
      onSessionDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">R</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">ResearchOS</span>
      </div>

      <Separator />

      <div className="px-3 py-3">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          History
        </p>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-1 pr-2">
            <AnimatePresence>
              {sessions.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                  No research sessions yet.
                </p>
              )}
              {sessions.map((session) => (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className={`group relative flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                      activeSessionId === session.session_id
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() => onSessionSelect(session.session_id)}
                  >
                    <p className="truncate font-medium leading-snug">
                      {session.query}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          MODE_COLORS[session.mode]
                        }`}
                      >
                        {session.mode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {session.source_count} sources
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                          <span className="text-xs">⋯</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={deletingId === session.session_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.session_id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
