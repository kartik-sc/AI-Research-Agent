// Mirrors backend app/models/schemas.py exactly.

export type ResearchMode = "quick" | "deep" | "academic";

export type ResearchStatus = "idle" | "running" | "complete" | "error";

export interface Source {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  trust_score: number;
  published_date: string | null;
  source_type: string;
}

export interface AgentEvent {
  agent_name: string;
  event_type: "thinking" | "action" | "complete";
  message: string;
  timestamp: string;
}

export interface ResearchRequest {
  query: string;
  mode: ResearchMode;
  session_id?: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  related: string[];
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface ResearchResponse {
  session_id: string;
  status: string;
  report: string;
  sources: Source[];
  sub_questions: string[];
  knowledge_nodes: KnowledgeNode[];
  knowledge_edges: KnowledgeEdge[];
}

export interface SessionSummary {
  session_id: string;
  query: string;
  mode: ResearchMode;
  status: string;
  created_at: string;
  source_count: number;
}

// Raw SSE payload shapes
export interface SseAgentEvent extends AgentEvent {
  type?: never;
}

export interface SseCompletePayload {
  type: "complete";
  session_id: string;
  report: string;
  sources: Source[];
  sub_questions: string[];
  knowledge_nodes: KnowledgeNode[];
  knowledge_edges: KnowledgeEdge[];
}

export interface SseErrorPayload {
  type: "error";
  message: string;
  session_id?: string;
}

export type SsePayload = SseAgentEvent | SseCompletePayload | SseErrorPayload;
