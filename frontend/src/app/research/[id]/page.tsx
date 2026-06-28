"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { ChevronRight, FolderOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentStream } from "@/components/agent-stream/AgentStream";
import { ReportHeader } from "@/components/answer/ReportHeader";
import { ReportRenderer } from "@/components/answer/ReportRenderer";
import { FollowUpSuggestions } from "@/components/answer/FollowUpSuggestions";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import { KnowledgeGraph } from "@/components/knowledge-graph/KnowledgeGraph";
import { swrFetcher, streamResearch, assignProject } from "@/lib/api";
import type { AgentEvent, ProjectSummary, SessionDetail } from "@/lib/types";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const stopStreamRef = useRef<(() => void) | null>(null);

  const { data: session, isLoading, mutate } = useSWR<SessionDetail>(
    `/api/sessions/${id}`,
    swrFetcher
  );
  const { data: projects } = useSWR<ProjectSummary[]>("/api/projects", swrFetcher);

  // Open SSE stream when the session is running
  useEffect(() => {
    if (!session || session.status !== "running") return;
    if (stopStreamRef.current) return; // already streaming

    const stop = streamResearch(
      id,
      (event) => setAgentEvents((prev) => [...prev, event]),
      (_payload) => {
        mutate(); // re-fetch session now that it's complete
        globalMutate("/api/sessions?limit=10");
      },
      (msg) => {
        toast.error(msg);
        mutate();
      }
    );
    stopStreamRef.current = stop;

    return () => {
      stop();
      stopStreamRef.current = null;
    };
  }, [id, session?.status, mutate]);

  const handleAssignProject = async (projectId: string | null) => {
    try {
      await assignProject(id, projectId);
      mutate();
      globalMutate("/api/sessions?limit=10");
      toast.success(projectId ? "Added to project" : "Removed from project");
    } catch {
      toast.error("Failed to update project");
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 md:px-10">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-6 w-96" />
        <div className="space-y-3 pt-4">
          {[100, 88, 95, 72, 100, 65].map((w, i) => (
            <Skeleton key={i} className="h-3 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const isRunning = session.status === "running";
  const isComplete = session.status === "complete";
  const currentProject = projects?.find((p) => p.id === session.project_id);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-6 py-5 md:px-10">

          {/* Breadcrumb + actions */}
          <div className="flex items-center justify-between gap-4">
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Link href="/history" className="hover:text-foreground transition-colors">
                History
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">
                {session.query.length > 40
                  ? session.query.slice(0, 39) + "…"
                  : session.query}
              </span>
            </nav>

            {/* Add to Project dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <FolderOpen className="h-3.5 w-3.5" />
                {currentProject ? currentProject.name : "Add to Project"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {(projects ?? []).map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleAssignProject(p.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                    {session.project_id === p.id && (
                      <Check className="ml-auto h-3 w-3 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                {session.project_id && (
                  <DropdownMenuItem
                    onClick={() => handleAssignProject(null)}
                    className="text-muted-foreground"
                  >
                    Remove from project
                  </DropdownMenuItem>
                )}
                {(projects ?? []).length === 0 && (
                  <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Running: show live stream */}
          {isRunning && (
            <AgentStream
              events={agentEvents}
              isRunning={true}
              sourceCount={0}
            />
          )}

          {/* Complete: tabbed report */}
          {isComplete && (
            <Tabs defaultValue="report">
              <TabsList className="mb-4">
                <TabsTrigger value="report">Report</TabsTrigger>
                <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="report">
                <ReportHeader markdown={session.report} />
                <ReportRenderer markdown={session.report} sources={session.sources} />
              </TabsContent>

              <TabsContent value="graph">
                <KnowledgeGraph
                  nodes={session.knowledge_nodes}
                  edges={session.knowledge_edges ?? []}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <div className="flex h-64 items-center justify-center rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">Timeline — coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {isComplete && (
            <FollowUpSuggestions suggestions={session.sub_questions} />
          )}
        </div>
      </div>

      {/* Sources panel */}
      {isComplete && (
        <div className="hidden md:flex w-[340px] flex-shrink-0 flex-col overflow-hidden border-l border-border p-4">
          <SourcesPanel sources={session.sources} isLoading={false} />
        </div>
      )}
    </div>
  );
}
