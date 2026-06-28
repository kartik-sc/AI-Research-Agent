"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { swrFetcher } from "@/lib/api";
import { formatRelativeTime } from "@/lib/time";
import type { SessionSummary } from "@/lib/types";

const MODE_DOT: Record<string, string> = {
  quick:    "bg-teal-400",
  deep:     "bg-blue-400",
  academic: "bg-amber-400",
};

export function HistoryPanel() {
  const router = useRouter();
  const { data, isLoading } = useSWR<SessionSummary[]>(
    "/api/sessions?limit=10",
    swrFetcher,
    { refreshInterval: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-1.5 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const sessions = data ?? [];

  if (sessions.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-[11px] text-muted-foreground/50">
        No sessions yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {sessions.map((s) => (
        <Tooltip key={s.session_id}>
          <TooltipTrigger
            onClick={() => router.push(`/research/${s.session_id}`)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-accent"
          >
            <div
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${MODE_DOT[s.mode] ?? "bg-muted-foreground"}`}
            />
            <span className="flex-1 truncate text-[11px] text-foreground/80">
              {s.query.length > 28 ? s.query.slice(0, 27) + "…" : s.query}
            </span>
            <span className="flex-shrink-0 font-mono text-[9px] text-muted-foreground/50">
              {formatRelativeTime(s.created_at)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-52">
            {s.query}
          </TooltipContent>
        </Tooltip>
      ))}

      <Link
        href="/history"
        className="mt-1 flex items-center gap-1 px-2.5 py-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        See all history
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
