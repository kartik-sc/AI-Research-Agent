export type ResearchMode = "quick" | "deep" | "academic" | "repository";

export interface ResearchRequest {
  query: string;
  mode: ResearchMode;
  session_id?: string;
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
  source_type: "web" | "arxiv" | "github" | "huggingface" | "reddit";
  trust_score: number;
  published_at: string | null;
}

export interface ResearchPlan {
  query: string;
  sub_queries: string[];
  search_strategies: string[];
  estimated_duration_seconds: number;
}

export interface AgentEvent {
  event_type:
    | "planning"
    | "searching"
    | "reading"
    | "verifying"
    | "writing"
    | "done"
    | "error";
  agent: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface ResearchResult {
  session_id: string;
  query: string;
  mode: ResearchMode;
  plan: ResearchPlan | null;
  sources: Source[];
  report: string;
  confidence_score: number;
  created_at: string;
}

export interface SessionSummary {
  session_id: string;
  query: string;
  mode: ResearchMode;
  created_at: string;
  source_count: number;
}

export type ResearchStatus = "idle" | "running" | "complete" | "error";
