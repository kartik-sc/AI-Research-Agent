"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ChevronRight, Plus } from "lucide-react";
import { HistoryCard } from "@/components/history/HistoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { swrFetcher } from "@/lib/api";
import { useResearchStore } from "@/lib/store";
import type { ProjectSummary, SessionSummary } from "@/lib/types";

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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setPendingProjectId } = useResearchStore();

  const { data: projects, isLoading: projectsLoading } = useSWR<ProjectSummary[]>(
    "/api/projects",
    swrFetcher
  );
  const { data: sessions, isLoading: sessionsLoading, mutate: mutateSessions } =
    useSWR<SessionSummary[]>(
      `/api/sessions?project_id=${id}&limit=50`,
      swrFetcher
    );

  const project = projects?.find((p) => p.id === id);

  const handleNewResearch = () => {
    setPendingProjectId(id);
    router.push("/");
  };

  if (projectsLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
          <p className="text-sm text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 px-6 py-6 md:px-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{project.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl"
              style={{
                backgroundColor: project.color + "22",
                border: `1px solid ${project.color}44`,
              }}
            >
              {ICON_MAP[project.icon] ?? "🗂️"}
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <p className="text-[11px] text-muted-foreground/60">
                {project.session_count} session{project.session_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleNewResearch}
            className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            New Research
          </button>
        </div>

        {/* Sessions */}
        {sessionsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (sessions ?? []).length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">No research yet in this project</p>
            <p className="text-xs text-muted-foreground/60">
              Use the New Research button to start one
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(sessions ?? []).map((s) => (
              <HistoryCard
                key={s.session_id}
                session={s}
                onDeleted={() => mutateSessions()}
                onUpdated={() => mutateSessions()}
                projects={projects ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
