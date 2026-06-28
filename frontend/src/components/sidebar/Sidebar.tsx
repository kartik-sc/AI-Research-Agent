"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FolderOpen,
  BookMarked,
  Clock,
  Settings2,
  Sun,
  Moon,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResearchStore } from "@/lib/store";

const NAV_ITEMS = [
  { icon: Home,       label: "Research",    href: "/" },
  { icon: FolderOpen, label: "Projects",    href: "/" },
  { icon: BookMarked, label: "Collections", href: "/" },
  { icon: Clock,      label: "History",     href: "/" },
  { icon: Settings2,  label: "Settings",    href: "/" },
] as const;

const MODE_PILL: Record<string, string> = {
  quick:    "text-emerald-400 bg-emerald-500/10",
  deep:     "text-blue-400   bg-blue-500/10",
  academic: "text-violet-400 bg-violet-500/10",
};

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const {
    sessions,
    activeSessionId,
    loadSessions,
    selectSession,
    removeSession,
    resetResearch,
  } = useResearchStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border bg-background">

      {/* ── Brand ───────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/90">
          {/* Atom SVG */}
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight">ResearchOS</span>
      </div>

      {/* ── New Research ─────────────────────────── */}
      <div className="px-3 pb-2">
        <button
          onClick={resetResearch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus className="h-3.5 w-3.5" />
          New Research
        </button>
      </div>

      <Separator />

      {/* ── Nav items ────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <Separator />

      {/* ── Session history ──────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden px-2 py-2">
        <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Recent
        </p>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 pr-1">
            <AnimatePresence initial={false}>
              {sessions.length === 0 && (
                <p className="py-6 text-center text-[11px] text-muted-foreground/50">
                  No sessions yet
                </p>
              )}

              {sessions.map((s) => (
                <motion.div
                  key={s.session_id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className={`group relative flex cursor-pointer flex-col rounded-md px-2.5 py-2 transition-colors hover:bg-accent ${
                    activeSessionId === s.session_id ? "bg-accent" : ""
                  }`}
                  onClick={() => selectSession(s.session_id)}
                >
                  <p className="truncate text-[11px] font-medium leading-snug text-foreground">
                    {s.query}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${MODE_PILL[s.mode] ?? "text-muted-foreground bg-muted"}`}>
                      {s.mode}
                    </span>
                    {s.status === "running" && (
                      <motion.div
                        className="h-1 w-1 rounded-full bg-blue-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                    )}
                  </div>

                  {/* Context menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="absolute right-1 top-1.5 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSession(s.session_id);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* ── Theme toggle ─────────────────────────── */}
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
