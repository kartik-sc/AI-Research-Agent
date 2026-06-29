"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { HistoryCard } from "@/components/history/HistoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { swrFetcher } from "@/lib/api";
import type { SessionSummary } from "@/lib/types";

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

function buildUrl(mode: string, search: string) {
  const q = new URLSearchParams({ limit: "50" });
  if (search.trim()) q.set("search", search.trim());
  return `/api/sessions?${q.toString()}`;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [activeMode, setActiveMode] = useState("all");

  const { data, isLoading, mutate } = useSWR<SessionSummary[]>(
    buildUrl(activeMode, search),
    swrFetcher,
    { keepPreviousData: true }
  );

  const sessions = (data ?? []).filter(
    (s) => activeMode === "all" || s.mode === activeMode
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">All your past research sessions</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </div>

        {/* Mode filter tabs */}
        <Tabs value={activeMode} onValueChange={setActiveMode}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="quick">Quick</TabsTrigger>
            <TabsTrigger value="deep">Deep</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
          </TabsList>

          {["all", "quick", "deep", "academic"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="mt-12 flex flex-col items-center gap-4 text-center">
                  <svg viewBox="0 0 80 80" className="h-16 w-16 text-muted-foreground/20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="40" cy="40" r="36" />
                    <path d="M40 22 L40 42 M40 50 L40 54" strokeLinecap="round" strokeWidth="2.5" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {search ? "No sessions match your search" : "No research yet"}
                    </p>
                    {!search && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        Start your first query from the home page
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={grid}
                  initial="hidden"
                  animate="show"
                  className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {sessions.map((s) => (
                    <motion.div key={s.session_id} variants={card}>
                      <HistoryCard session={s} onDeleted={() => mutate()} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
