"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { swrFetcher } from "@/lib/api";
import { formatRelativeTime } from "@/lib/time";
import type { ProjectSummary } from "@/lib/types";

const ICON_MAP: Record<string, string> = {
  folder: "🗂️",
  research: "🔬",
  lab: "🧪",
  chart: "📊",
  book: "📚",
  globe: "🌐",
  brain: "🧠",
  star: "⭐",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<ProjectSummary[]>("/api/projects", swrFetcher);

  const projects = data ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Organise your research into projects</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No projects yet — create one from the sidebar
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/history?project_id=${p.id}`)}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-ring hover:bg-accent/30"
              >
                {/* Color swatch + icon */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: p.color + "22", border: `1px solid ${p.color}44` }}
                  >
                    {ICON_MAP[p.icon] ?? "🗂️"}
                  </div>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                </div>

                {/* Name + description */}
                <div>
                  <p className="font-medium leading-snug text-foreground">{p.name}</p>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{p.session_count} session{p.session_count !== 1 ? "s" : ""}</span>
                  <span className="text-border">·</span>
                  <span>Updated {formatRelativeTime(p.updated_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
