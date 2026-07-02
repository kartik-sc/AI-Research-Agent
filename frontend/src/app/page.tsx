"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSearch, CompactSearch } from "@/components/search/SearchBar";
import { AgentStream } from "@/components/agent-stream/AgentStream";
import { ReportHeader } from "@/components/answer/ReportHeader";
import { ReportRenderer } from "@/components/answer/ReportRenderer";
import { FollowUpSuggestions } from "@/components/answer/FollowUpSuggestions";
import { ResearchTimeline } from "@/components/answer/ResearchTimeline";
import { ThreadBreadcrumb } from "@/components/answer/ThreadBreadcrumb";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import { KnowledgeGraph } from "@/components/knowledge-graph/KnowledgeGraph";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useResearchStore } from "@/lib/store";
import type { SessionDetail } from "@/lib/types";

export default function Home() {
  const { status, mode, query, agentEvents, response, setMode } = useResearchStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("researchDefaultMode");
    if (stored === "quick" || stored === "deep" || stored === "academic") {
      setMode(stored);
    }
  }, [setMode]);

  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isComplete = status === "complete";
  const sourceCount = response?.sources.length ?? 0;

  // The timeline component expects a persisted SessionDetail; synthesise one
  // from the in-memory response plus the streamed agent-event timestamps.
  const timelineSession: SessionDetail | null = response
    ? {
        ...response,
        query,
        mode,
        created_at: agentEvents[0]?.timestamp ?? new Date().toISOString(),
        completed_at: agentEvents[agentEvents.length - 1]?.timestamp ?? null,
        duration_seconds:
          agentEvents.length > 1
            ? (new Date(agentEvents[agentEvents.length - 1].timestamp).getTime() -
                new Date(agentEvents[0].timestamp).getTime()) /
              1000
            : null,
      }
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── STATE 1: Idle — centered hero ─────────────────────── */}
        {isIdle && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-1 items-center justify-center overflow-hidden p-8"
          >
            {/* Aurora background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="aurora-blob aurora-blob-1" />
              <div className="aurora-blob aurora-blob-2" />
              <div className="aurora-blob aurora-blob-3" />
            </div>
            <HeroSearch />
          </motion.div>
        )}

        {/* ── STATE 2 + 3: Active research ──────────────────────── */}
        {!isIdle && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <CompactSearch />
            <ThreadBreadcrumb />

            <div className="flex flex-1 overflow-hidden">

              {/* Left: main content */}
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-col gap-5 px-5 py-5 md:px-8">

                  {/* Agent stream */}
                  <AgentStream
                    events={agentEvents}
                    isRunning={isRunning}
                    sourceCount={sourceCount}
                  />

                  {/* Loading skeleton while streaming */}
                  {isRunning && (
                    <div className="space-y-4 pt-2">
                      {[100, 85, 93, 70, 100, 60].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded-full bg-muted"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Tabbed content when complete */}
                  {isComplete && response && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Tabs defaultValue="report">
                        <TabsList className="mb-4">
                          <TabsTrigger value="report">Report</TabsTrigger>
                          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
                          <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>

                        <TabsContent value="report">
                          <ReportHeader markdown={response.report} />
                          <ReportRenderer
                            markdown={response.report}
                            sources={response.sources}
                          />
                        </TabsContent>

                        <TabsContent value="graph">
                          <KnowledgeGraph
                            nodes={response.knowledge_nodes}
                            edges={response.knowledge_edges ?? []}
                          />
                        </TabsContent>

                        <TabsContent value="timeline">
                          {timelineSession ? (
                            <ResearchTimeline session={timelineSession} />
                          ) : (
                            <div className="flex h-64 items-center justify-center rounded-xl border border-border">
                              <p className="text-sm text-muted-foreground">
                                Timeline unavailable
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      <FollowUpSuggestions suggestions={response.sub_questions} />
                    </motion.div>
                  )}

                  {/* Sources on mobile (below content) */}
                  {(isRunning || isComplete) && (
                    <div className="block md:hidden border-t border-border pt-5">
                      <SourcesPanel
                        sources={response?.sources ?? []}
                        isLoading={isRunning}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: sources panel (desktop only) */}
              {(isRunning || isComplete) && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28 }}
                  className="hidden md:flex w-[340px] xl:w-[380px] flex-shrink-0 flex-col overflow-hidden border-l border-border"
                >
                  <div className="flex-1 overflow-hidden p-4">
                    <SourcesPanel
                      sources={response?.sources ?? []}
                      isLoading={isRunning}
                    />
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
