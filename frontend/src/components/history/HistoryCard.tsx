"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, Trash2, Zap, Layers, GraduationCap, FolderPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { deleteSession, assignProject } from "@/lib/api";
import { formatRelativeTime, formatDuration } from "@/lib/time";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { SessionSummary, ProjectSummary } from "@/lib/types";

interface HistoryCardProps {
  session: SessionSummary;
  onDeleted: () => void;
  onUpdated?: () => void;
  projects?: ProjectSummary[];
}

const MODE_META = {
  quick:    { icon: Zap,           color: "text-teal-400 bg-teal-400/10",   label: "Quick" },
  deep:     { icon: Layers,        color: "text-blue-400 bg-blue-400/10",   label: "Deep" },
  academic: { icon: GraduationCap, color: "text-amber-400 bg-amber-400/10", label: "Academic" },
} as const;

export function HistoryCard({ session: s, onDeleted, onUpdated, projects }: HistoryCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = MODE_META[s.mode as keyof typeof MODE_META] ?? MODE_META.deep;
  const ModeIcon = meta.icon;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    setDeleting(true);
    try {
      await deleteSession(s.session_id);
      toast.success("Session deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete session");
      setDeleting(false);
    }
  };

  const handleAssign = async (projectId: string | null) => {
    try {
      await assignProject(s.session_id, projectId);
      toast.success(projectId ? "Added to project" : "Removed from project");
      onUpdated?.();
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      onClick={() => router.push(`/research/${s.session_id}`)}
      onMouseMove={handleMouseMove}
      className="spotlight-card group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-ring/60 hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5"
    >
      {/* Action buttons */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {projects !== undefined && (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex items-center rounded-md bg-muted p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-ring/10 hover:text-foreground group-hover:opacity-100"
            >
              <FolderPlus className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {projects.length === 0 ? (
                <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
              ) : (
                projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssign(p.id);
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="flex-1 truncate">{p.name}</span>
                    {s.project_id === p.id && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))
              )}
              {s.project_id && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssign(null);
                  }}
                >
                  Remove from project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium opacity-0 transition-all group-hover:opacity-100 ${
            confirming
              ? "bg-destructive/15 text-destructive"
              : "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          }`}
        >
          <Trash2 className="h-3 w-3" />
          {confirming ? "Confirm?" : ""}
        </button>
      </div>

      {/* Query */}
      <p className="pr-14 text-sm font-medium leading-snug text-foreground">
        {s.query}
      </p>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.color}`}>
          <ModeIcon className="h-2.5 w-2.5" />
          {meta.label}
        </span>

        <span className="text-[10px] text-muted-foreground/60">
          {formatRelativeTime(s.created_at)}
        </span>

        {s.duration_seconds != null && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
            <Clock className="h-2.5 w-2.5" />
            {formatDuration(s.duration_seconds)}
          </span>
        )}

        {s.source_count > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
            <FileText className="h-2.5 w-2.5" />
            {s.source_count} sources
          </span>
        )}

        {s.status === "running" && (
          <span className="rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
            Running
          </span>
        )}
      </div>
    </div>
  );
}
