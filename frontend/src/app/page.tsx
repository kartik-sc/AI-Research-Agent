"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { AgentStream } from "@/components/agent-stream/AgentStream";
import { ReportView } from "@/components/answer/ReportView";
import { SourceList } from "@/components/sources/SourceList";
import { KnowledgeGraph } from "@/components/knowledge-graph/KnowledgeGraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { startResearch, streamResearch, getResult, listSessions } from "@/lib/api";
import type {
  AgentEvent,
  ResearchMode,
  ResearchResult,
  ResearchStatus,
  SessionSummary,
} from "@/lib/types";

export default function Home() {
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(async (query: string, mode: ResearchMode) => {
    setStatus("running");
    setEvents([]);
    setResult(null);

    try {
      const { session_id } = await startResearch({ query, mode });
      setActiveSessionId(session_id);

      const cleanup = streamResearch(
        session_id,
        (event) => setEvents((prev) => [...prev, event]),
        async () => {
          setStatus("complete");
          const res = await getResult(session_id);
          setResult(res);
          const updatedSessions = await listSessions();
          setSessions(updatedSessions);
        },
        (msg) => {
          setStatus("error");
          setEvents((prev) => [
            ...prev,
            {
              event_type: "error",
              agent: "system",
              message: msg,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      );

      return cleanup;
    } catch (err) {
      setStatus("error");
      setEvents([
        {
          event_type: "error",
          agent: "system",
          message: err instanceof Error ? err.message : "Failed to start research",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const handleSessionSelect = useCallback(async (id: string) => {
    setActiveSessionId(id);
    setStatus("complete");
    setEvents([]);
    try {
      const res = await getResult(id);
      setResult(res);
    } catch {
      setResult(null);
    }
  }, []);

  const handleSessionDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.session_id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setResult(null);
      setStatus("idle");
    }
  }, [activeSessionId]);

  const isLoading = status === "running";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionDelete={handleSessionDelete}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-center border-b border-border px-6 py-4">
          <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {status === "idle" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-2xl font-semibold tracking-tight">ResearchOS</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Enter a research question above. Choose a mode, then let the
                multi-agent pipeline plan, retrieve, verify, and write your report.
              </p>
            </div>
          )}

          {status !== "idle" && (
            <div className="flex flex-1 overflow-hidden">
              {/* Main content */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                {(isLoading || events.length > 0) && (
                  <AgentStream events={events} isRunning={isLoading} />
                )}

                {(status === "complete" || status === "error") && result && (
                  <Tabs defaultValue="report">
                    <TabsList className="mb-4">
                      <TabsTrigger value="report">Report</TabsTrigger>
                      <TabsTrigger value="graph">
                        Knowledge Graph
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="report">
                      <ReportView result={result} isLoading={false} />
                    </TabsContent>

                    <TabsContent value="graph">
                      <KnowledgeGraph
                        sources={result.sources}
                        query={result.query}
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {isLoading && <ReportView result={null} isLoading />}
              </div>

              {/* Sources panel */}
              <Separator orientation="vertical" />
              <div className="w-72 overflow-y-auto p-4">
                <SourceList
                  sources={result?.sources ?? []}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
