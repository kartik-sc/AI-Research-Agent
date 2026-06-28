"use client";

import { create } from "zustand";
import {
  startResearch as apiStart,
  streamResearch,
  getResult,
  listSessions as apiListSessions,
  deleteSession as apiDeleteSession,
} from "./api";
import type {
  AgentEvent,
  ResearchMode,
  ResearchResponse,
  ResearchStatus,
  SessionSummary,
  Source,
  SseCompletePayload,
} from "./types";

export interface ThreadEntry {
  sessionId: string;
  query: string;
}

interface ResearchStore {
  // ── Research state ──────────────────────────────────────
  query: string;
  mode: ResearchMode;
  sessionId: string | null;
  status: ResearchStatus;
  agentEvents: AgentEvent[];
  response: ResearchResponse | null;

  // ── Follow-up thread ─────────────────────────────────────
  threadHistory: ThreadEntry[];

  // ── Session history ──────────────────────────────────────
  sessions: SessionSummary[];
  activeSessionId: string | null;

  // ── UI: citation highlight ────────────────────────────────
  highlightedSourceIndex: number | null;

  // ── Private: SSE cleanup handle ──────────────────────────
  _stopStream: (() => void) | null;

  // ── Actions ───────────────────────────────────────────────
  setQuery: (q: string) => void;
  setMode: (m: ResearchMode) => void;
  setHighlightedSource: (n: number | null) => void;

  startResearch: () => Promise<void>;
  startFollowUp: (followUpQuery: string) => Promise<void>;
  appendEvent: (e: AgentEvent) => void;
  setComplete: (payload: SseCompletePayload) => void;
  resetResearch: () => void;

  loadSessions: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  query: "",
  mode: "deep",
  sessionId: null,
  status: "idle",
  agentEvents: [],
  response: null,
  threadHistory: [],
  sessions: [],
  activeSessionId: null,
  highlightedSourceIndex: null,
  _stopStream: null,

  setQuery: (q) => set({ query: q }),
  setMode: (m) => set({ mode: m }),
  setHighlightedSource: (n) => set({ highlightedSourceIndex: n }),

  startResearch: async () => {
    const { query, mode, _stopStream } = get();
    if (!query.trim()) return;

    _stopStream?.();

    set({
      status: "running",
      agentEvents: [],
      response: null,
      sessionId: null,
      _stopStream: null,
    });

    try {
      const { session_id } = await apiStart({ query: query.trim(), mode });

      const stop = streamResearch(
        session_id,
        (event) => get().appendEvent(event),
        (payload) => get().setComplete(payload),
        (msg) => {
          set({ status: "error" });
          get().appendEvent({
            agent_name: "System",
            event_type: "complete",
            message: msg,
            timestamp: new Date().toISOString(),
          });
        }
      );

      set({ sessionId: session_id, activeSessionId: session_id, _stopStream: stop });
    } catch (err) {
      set({ status: "error" });
      get().appendEvent({
        agent_name: "System",
        event_type: "complete",
        message: err instanceof Error ? err.message : "Failed to start research",
        timestamp: new Date().toISOString(),
      });
    }
  },

  startFollowUp: async (followUpQuery: string) => {
    const { sessionId, query } = get();

    // Push current session into thread before starting new research
    if (sessionId && query) {
      set((s) => ({
        threadHistory: [...s.threadHistory, { sessionId, query }],
      }));
    }

    set({ query: followUpQuery });
    await get().startResearch();
  },

  appendEvent: (e) =>
    set((s) => ({ agentEvents: [...s.agentEvents, e] })),

  setComplete: (payload) => {
    const response: ResearchResponse = {
      session_id: payload.session_id,
      status: "complete",
      report: payload.report,
      sources: payload.sources,
      sub_questions: payload.sub_questions,
      knowledge_nodes: payload.knowledge_nodes,
      knowledge_edges: payload.knowledge_edges ?? [],
    };
    set({ status: "complete", response, _stopStream: null });
    get().loadSessions();
  },

  resetResearch: () => {
    get()._stopStream?.();
    set({
      query: "",
      status: "idle",
      agentEvents: [],
      response: null,
      sessionId: null,
      activeSessionId: null,
      threadHistory: [],
      _stopStream: null,
    });
  },

  loadSessions: async () => {
    try {
      const sessions = await apiListSessions();
      set({ sessions });
    } catch {
      // Network not available — don't crash
    }
  },

  selectSession: async (id) => {
    set({ activeSessionId: id, status: "running", agentEvents: [], response: null });
    try {
      const result = await getResult(id);
      set({
        sessionId: id,
        status: "complete",
        response: result,
        query: get().sessions.find((s) => s.session_id === id)?.query ?? "",
      });
    } catch {
      set({ status: "error" });
    }
  },

  removeSession: async (id) => {
    try {
      await apiDeleteSession(id);
      set((s) => ({
        sessions: s.sessions.filter((x) => x.session_id !== id),
        ...(s.activeSessionId === id
          ? { activeSessionId: null, status: "idle", response: null, agentEvents: [] }
          : {}),
      }));
    } catch {
      // ignore
    }
  },
}));
